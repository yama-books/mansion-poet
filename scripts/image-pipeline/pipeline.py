"""Local, explicit-input IMG-PIPE-01 batch processor (Python 3.12 + Pillow)."""
from __future__ import annotations

import argparse
from collections import Counter
from copy import deepcopy
from datetime import datetime
import hashlib
import html
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import tempfile
import warnings

from PIL import Image, ImageDraw, ImageOps, features

VERSION = "1.0"
KINDS = {"original_svg", "generated_illustration", "original_photo", "licensed_photo", "map"}
SLOTS = {"hero", "residence", "print_hero", "location_support", "map_effect"}
TEXT = ("group", "sceneId", "variantId", "caption", "owner", "license", "sourceURL",
        "createdAt", "sourceRetrievedAt", "assetScope", "generationTool", "generatedAt",
        "promptRecipeId", "promptText", "sourcePromptId", "provenance", "reviewNotes")
PUBLIC = ("id", "group", "themes", "slots", "orientation", "focalPoint", "kind", "caption",
          "rightsStatus", "reviewStatus", "owner", "license", "sourceURL", "createdAt",
          "sourceRetrievedAt", "permissionToRedistribute", "sourcePromptId", "assetScope",
          "sceneId", "variantId", "parentAssetId", "reviewer", "imageShowsRealPOI",
          "noticeType", "mapAttribution", "generationTool", "generatedAt", "provenance")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def dumps(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n"


def number(value):
    return type(value) in (float, int) and math.isfinite(value)


def contained(path, root):
    return path == root or root in path.parents


def asset_id(asset):
    return asset.get("id", asset.get("assetId"))


def validate(manifest):
    """Validate IMG-00 + delivery metadata; return machine-readable errors, no I/O."""
    errors = []

    def err(i, code, field):
        errors.append({"index": i, "code": code, "field": field})

    if not isinstance(manifest, dict) or manifest.get("schemaVersion") != VERSION or not isinstance(manifest.get("assets"), list):
        return [{"index": None, "code": "manifest_schema", "field": "schemaVersion/assets"}]
    assets = manifest["assets"]
    ids = Counter(asset_id(a) for a in assets if isinstance(a, dict) and isinstance(asset_id(a), str))
    variants = Counter((a.get("parentAssetId"), a.get("variantId")) for a in assets
                       if isinstance(a, dict) and isinstance(a.get("parentAssetId"), str)
                       and isinstance(a.get("variantId"), str))
    parents = {}
    for i, a in enumerate(assets):
        if not isinstance(a, dict):
            err(i, "asset_object", "assets")
            continue
        aid = asset_id(a)
        if not isinstance(aid, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,79}", aid):
            err(i, "invalid_id", "id")
        elif ids[aid] > 1:
            err(i, "duplicate_id", "id")
        if "id" in a and "assetId" in a and a["id"] != a["assetId"]:
            err(i, "id_alias_mismatch", "assetId")
        for key in TEXT + ("originalPath",):
            if not isinstance(a.get(key), str) or not a[key].strip():
                err(i, "missing_string", key)
        for key in ("createdAt", "sourceRetrievedAt", "generatedAt"):
            try:
                datetime.fromisoformat(a.get(key, ""))
            except (TypeError, ValueError):
                err(i, "date_iso8601", key)
        if "renditions" in a:
            rendition_map = a["renditions"]
            if not isinstance(rendition_map, dict):
                err(i, "renditions_object", "renditions")
            else:
                for role in ("screen", "print"):
                    rendition = rendition_map.get(role)
                    if not isinstance(rendition, dict) or not isinstance(rendition.get("path"), str) or not rendition["path"].strip() or any(type(rendition.get(k)) is not int or rendition[k] <= 0 for k in ("width", "height")):
                        err(i, "rendition_shape", f"renditions.{role}")
        for key in ("themes", "slots", "noticeType"):
            if not isinstance(a.get(key), list) or not a[key] or any(not isinstance(v, str) or not v.strip() for v in a[key]):
                err(i, "string_array", key)
        for key in ("rejectionReasons", "prohibitedTags"):
            if not isinstance(a.get(key), list) or any(not isinstance(v, str) or not v.strip() for v in a[key]):
                err(i, "string_array", key)
        if isinstance(a.get("slots"), list) and any(not isinstance(v, str) or v not in SLOTS for v in a["slots"]):
            err(i, "enum", "slots")
        for key, values in (("kind", KINDS), ("orientation", {"portrait", "landscape", "square"}),
                            ("rightsStatus", {"unknown", "review_required", "approved"}),
                            ("reviewStatus", {"candidate", "accepted", "rejected"})):
            if not isinstance(a.get(key), str) or a[key] not in values:
                err(i, "enum", key)
        for key in ("permissionToRedistribute", "imageShowsRealPOI"):
            if type(a.get(key)) is not bool:
                err(i, "boolean", key)
        focal = a.get("focalPoint")
        if not isinstance(focal, dict) or any(not number(focal.get(k)) or not 0 <= focal[k] <= 1 for k in ("x", "y")):
            err(i, "focal_range", "focalPoint")
        if "parentAssetId" not in a or (a["parentAssetId"] is not None and not isinstance(a["parentAssetId"], str)):
            err(i, "parent_type", "parentAssetId")
        elif a["parentAssetId"] is not None:
            parent = a["parentAssetId"]
            if isinstance(aid, str):
                parents[aid] = parent
            if parent == aid or parent not in ids:
                err(i, "invalid_parent", "parentAssetId")
            if isinstance(a.get("variantId"), str) and variants[(parent, a["variantId"])] > 1:
                err(i, "duplicate_derivation", "variantId")
        if not isinstance(a.get("reviewer"), str):
            err(i, "reviewer_string", "reviewer")
        elif a.get("reviewStatus") == "accepted" and not a["reviewer"].strip():
            err(i, "reviewer_required", "reviewer")
        if a.get("kind") == "generated_illustration" and a.get("imageShowsRealPOI") is not False:
            err(i, "generated_poi_claim", "imageShowsRealPOI")
        if a.get("kind") == "map" and not a.get("mapAttribution"):
            err(i, "map_attribution", "mapAttribution")
    for i, a in enumerate(assets):
        if not isinstance(a, dict) or not isinstance(asset_id(a), str):
            continue
        seen, current = set(), asset_id(a)
        while current in parents:
            if current in seen:
                err(i, "parent_cycle", "parentAssetId")
                break
            seen.add(current)
            current = parents[current]
    return errors


def crop_box(size, ratio, focal):
    w, h = size
    cw, ch = min(w, h * ratio), min(h, w / ratio)
    cw, ch = max(1, round(cw)), max(1, round(ch))
    x = max(0, min(w - cw, round(focal["x"] * w - cw / 2)))
    y = max(0, min(h - ch, round(focal["y"] * h - ch / 2)))
    return x, y, x + cw, y + ch


def resize(image, edge):
    out = image.copy()
    out.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    return out


def encode(image, fmt, quality):
    buf = io.BytesIO()
    # Rebuild pixels so EXIF/GPS/XMP/ICC and arbitrary source metadata never leak.
    clean = Image.frombytes(image.mode, image.size, image.tobytes())
    clean.save(buf, fmt, **({"quality": quality, "method": 6} if fmt == "WEBP" else {}))
    return buf.getvalue()


def read_image(path):
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        raw = path.read_bytes()
        with Image.open(io.BytesIO(raw)) as image:
            if image.format not in {"PNG", "JPEG", "WEBP"} or getattr(image, "n_frames", 1) != 1:
                raise ValueError("only single-frame PNG/JPEG/WebP inputs supported")
            image.load()
            fmt, stored_size = image.format, image.size
            oriented = ImageOps.exif_transpose(image)
            return raw, oriented.convert("RGBA" if "A" in oriented.getbands() else "RGB"), fmt, stored_size


def options_check(args):
    for key in ("screen_edge", "print_edge", "crop_edge"):
        if not 1 <= getattr(args, key) <= 12000:
            raise ValueError(f"{key} must be 1..12000")
    if not 1 <= args.quality <= 100:
        raise ValueError("quality must be 1..100")
    for key in ("print_width_mm", "print_height_mm", "target_ppi"):
        if not number(getattr(args, key)) or getattr(args, key) <= 0:
            raise ValueError(f"{key} must be finite and positive")
    if not features.check("webp"):
        raise ValueError("Pillow WebP support unavailable")


def build(args):
    """Encode sequentially without writing; list exact proposed paths, bytes and hashes."""
    options_check(args)
    root, target = args.input.resolve(strict=True), args.output.resolve()
    if not root.is_dir() or contained(target, root) or contained(root, target):
        raise ValueError("input and output must be separate, non-overlapping directories")
    if target.exists():
        raise ValueError("output already exists; choose a new output directory")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
    errors = validate(manifest)
    report = {"schemaVersion": VERSION, "errors": errors, "warnings": [], "assets": [],
              "files": [], "publishedCount": 0, "written": False}
    if errors:
        return report, {}, []
    blobs, thumb_rows, loaded, hashes = {}, [], [], {}
    for i, entry in enumerate(manifest["assets"]):
        a = deepcopy(entry)
        aid = asset_id(a)
        a["id"] = aid
        try:
            relative = Path(a["originalPath"])
            path = (root / relative).resolve(strict=True)
            if relative.is_absolute() or not contained(path, root) or not path.is_file():
                raise ValueError("originalPath must resolve to a file inside input")
            if args.manifest.resolve() == path:
                raise ValueError("manifest cannot be an image input")
            raw, image, fmt, stored_size = read_image(path)
            sha = digest(raw)
            if sha in hashes:
                report["errors"].append({"index": i, "code": "duplicate_original_sha256", "otherId": hashes[sha]})
            hashes[sha] = aid
            w, h = image.size
            orientation = "square" if w == h else "portrait" if h > w else "landscape"
            if orientation != a["orientation"]:
                raise ValueError("orientation does not match EXIF-oriented pixels")
            actual = {"width": w, "height": h, "storedWidth": stored_size[0], "storedHeight": stored_size[1],
                      "aspectRatio": round(w / h, 8), "bytes": len(raw), "sha256": sha, "format": fmt}
            if "original" in a:
                if not isinstance(a["original"], dict) or any(a["original"].get(k) != actual[k] for k in ("width", "height", "bytes", "sha256")):
                    raise ValueError("supplied original dimensions/bytes/hash mismatch")
            a["original"] = actual
            a["renditions"] = {}
            row = [("original", resize(image, 180))]
            specs = [("screen", resize(image, args.screen_edge), "WEBP", "web", None),
                     ("print", resize(image, args.print_edge), "PNG", "print", None)]
            for name, ratio in (("portrait", 4 / 5), ("landscape", 16 / 9)):
                box = crop_box(image.size, ratio, a["focalPoint"])
                specs.append((name, resize(image.crop(box), args.crop_edge), "WEBP", "crops", box))
            for name, rendition, output_fmt, folder, box in specs:
                rel = f"{folder}/{aid}-{name}.{'webp' if output_fmt == 'WEBP' else 'png'}"
                data = encode(rendition, output_fmt, args.quality)
                blobs[rel] = data
                meta = {"path": rel, "width": rendition.width, "height": rendition.height,
                        "bytes": len(data), "sha256": digest(data), "upscaled": False}
                if box:
                    meta.update({"cropBox": list(box), "cropReviewStatus": "candidate",
                                 "subjectSafety": "requires_human_review"})
                if name == "print":
                    native = min(w * 25.4 / args.print_width_mm, h * 25.4 / args.print_height_mm)
                    effective = min(rendition.width * 25.4 / args.print_width_mm,
                                    rendition.height * 25.4 / args.print_height_mm)
                    meta.update({"placementMm": [args.print_width_mm, args.print_height_mm],
                                 "nativePpi": round(native, 2), "effectivePpi": round(effective, 2),
                                 "targetPpi": args.target_ppi, "meetsTarget": effective >= args.target_ppi,
                                 "colorManagement": "unmanaged RGB; not CMYK/PDF-X"})
                    if effective < args.target_ppi:
                        report["warnings"].append({"id": aid, "code": "print_ppi_below_target", "ppi": round(effective, 2)})
                a["renditions"][name] = meta
                row.append((name, resize(rendition, 180)))
            eligible = a["rightsStatus"] == "approved" and a["reviewStatus"] == "accepted" and a["permissionToRedistribute"] is True
            a["publicationEligible"] = eligible
            if not eligible:
                report["warnings"].append({"id": aid, "code": "excluded_from_published", "rightsStatus": a["rightsStatus"], "reviewStatus": a["reviewStatus"]})
            loaded.append(a)
            thumb_rows.append((aid, row))
        except (OSError, ValueError, SyntaxError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
            report["errors"].append({"index": i, "code": "input_image", "message": str(exc)})
    # One invalid input aborts the batch before any outputs are written.
    if report["errors"]:
        return report, {}, []
    # A derived asset cannot bypass an unapproved/rejected ancestor's rights.
    by_id = {a["id"]: a for a in loaded}
    for a in loaded:
        parent = a["parentAssetId"]
        while parent:
            ancestor = by_id[parent]
            if not ancestor["publicationEligible"]:
                a["publicationEligible"] = False
                report["warnings"].append({"id": a["id"], "code": "ancestor_not_publishable"})
            parent = ancestor["parentAssetId"]
    report["assets"] = loaded
    return report, blobs, thumb_rows


def package(report, blobs, rows):
    links = []
    # Paginate to keep the contact sheet allocation bounded at 20 assets per page.
    for page, start in enumerate(range(0, len(rows), 20), 1):
        chunk = rows[start:start + 20]
        sheet = Image.new("RGB", (1000, 180 * len(chunk)), "#eeeeee")
        draw = ImageDraw.Draw(sheet)
        for y, (aid, items) in enumerate(chunk):
            draw.text((8, y * 180 + 4), aid, fill="black")
            for x, (name, thumb) in enumerate(items):
                draw.text((x * 200 + 8, y * 180 + 20), name, fill="black")
                preview = thumb.copy()
                preview.thumbnail((184, 140))
                pos = (x * 200 + 8, y * 180 + 38)
                sheet.paste(preview, pos, preview if preview.mode == "RGBA" else None)
        rel = f"thumbnails/contact-{page:03}.png"
        blobs[rel] = encode(sheet, "PNG", 100)
        links.append(f'<a href="{rel}"><img width="1000" src="{rel}" alt="contact sheet {page}"></a>')
    warning_text = html.escape(dumps(report["warnings"]))
    blobs["contact-sheet.html"] = ("<!doctype html><html lang='ja'><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width'><title>IMG-PIPE-01 review</title>"
        "<style>body{font:16px sans-serif;margin:24px}img{max-width:100%;height:auto}pre{white-space:pre-wrap}</style>"
        "<h1>Local crop candidates</h1><p>Original / screen / print / portrait 4:5 / landscape 16:9. "
        "Crops require human subject-safety review. Synthetic fixtures are not property evidence.</p>"
        + "".join(links) + "<h2>Warnings</h2><pre>" + warning_text + "</pre></html>\n").encode("utf-8")
    candidates = {"schemaVersion": VERSION, "assets": report["assets"]}
    published = []
    for a in report["assets"]:
        if a["publicationEligible"]:
            public = {k: a[k] for k in PUBLIC if k in a}
            # Crop candidates are deliberately excluded until individual review.
            public["renditions"] = {k: a["renditions"][k] for k in ("screen", "print")}
            published.append(public)
    report["publishedCount"] = len(published)
    for name, obj in (("candidate-manifest.json", candidates),
                      ("published-manifest.json", {"schemaVersion": VERSION, "assets": published})):
        blobs[name] = dumps(obj).encode("utf-8")
    report["files"] = [{"path": name, "bytes": len(data), "sha256": digest(data)} for name, data in sorted(blobs.items())]


def write_new(target, blobs, report):
    target = target.resolve()
    if target.exists():
        raise ValueError("output already exists")
    target.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".img-pipe-", dir=target.parent))
    try:
        for name, data in blobs.items():
            path = stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        (stage / "report.json").write_text(dumps(report), encoding="utf-8")
        if target.exists():
            raise ValueError("output appeared during processing")
        os.rename(stage, target)
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--input", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--write", action="store_true", help="write to a NEW directory; otherwise dry-run")
    p.add_argument("--screen-edge", type=int, default=1600)
    p.add_argument("--print-edge", type=int, default=3508)
    p.add_argument("--crop-edge", type=int, default=1200)
    p.add_argument("--quality", type=int, default=82)
    p.add_argument("--print-width-mm", type=float, default=180)
    p.add_argument("--print-height-mm", type=float, default=120)
    p.add_argument("--target-ppi", type=float, default=300)
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        report, blobs, rows = build(args)
        if report["errors"]:
            print(dumps(report), end="")
            return 2
        package(report, blobs, rows)
        # Plan is printed and flushed BEFORE any destination writes.
        print(dumps(report), end="", flush=True)
        if args.write:
            report["written"] = True
            write_new(args.output, blobs, report)
            print(dumps({"written": True, "output": str(args.output.resolve())}), end="")
        return 0
    except (OSError, ValueError) as exc:
        print(dumps({"errors": [{"code": "batch_error", "message": str(exc)}], "written": False}), end="")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
