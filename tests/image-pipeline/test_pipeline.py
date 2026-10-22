import contextlib
from copy import deepcopy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
from fixtures import generate

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("pipeline", ROOT / "scripts/image-pipeline/pipeline.py")
p = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(p)
LOCAL = Path(__file__).parent / ".local"
LOCAL.mkdir(exist_ok=True)


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=LOCAL)
        self.base = Path(self.temp.name)
        self.source = self.base / "input"
        self.manifest = generate(self.source, 2)
        self.target = self.base / "output"

    def tearDown(self):
        self.temp.cleanup()

    def args(self, *extra):
        return p.parser().parse_args(["--manifest", str(self.source / "intake.json"), "--input", str(self.source),
                                      "--output", str(self.target), "--screen-edge", "200", "--crop-edge", "160", *extra])

    def save(self):
        (self.source / "intake.json").write_text(p.dumps(self.manifest), encoding="utf-8")

    def run_build(self):
        self.save()
        report, blobs, rows = p.build(self.args())
        if not report["errors"]:
            p.package(report, blobs, rows)
        return report, blobs, rows

    def codes(self):
        return {e["code"] for e in p.validate(self.manifest)}

    def test_small_image_dimensions_hashes_and_original_unchanged(self):
        before = {f.name: p.digest(f.read_bytes()) for f in self.source.iterdir()}
        r, blobs, _ = p.build(self.args())
        self.assertEqual(r["errors"], [])
        screen = r["assets"][0]["renditions"]["screen"]
        self.assertEqual((screen["width"], screen["height"]), (200, 150))
        for a in r["assets"]:
            for v in a["renditions"].values():
                self.assertEqual(v["sha256"], p.digest(blobs[v["path"]]))
                self.assertEqual(v["bytes"], len(blobs[v["path"]]))
                with Image.open(io.BytesIO(blobs[v["path"]])) as out:
                    self.assertEqual(out.size, (v["width"], v["height"]))
                    self.assertLessEqual(max(out.size), 3508)
        self.assertEqual(before, {f.name: p.digest(f.read_bytes()) for f in self.source.iterdir()})
        self.assertFalse(self.target.exists())

    def test_manifest_and_encodings_are_deterministic(self):
        first = self.run_build()
        second = self.run_build()
        self.assertEqual(first[:2], second[:2])

    def test_unapproved_excluded_and_approved_included_without_prompts_or_crop(self):
        a = self.manifest["assets"][0]
        a.update(rightsStatus="approved", reviewStatus="accepted", permissionToRedistribute=True, reviewer="Test Reviewer")
        r, blobs, _ = self.run_build()
        public = json.loads(blobs["published-manifest.json"])
        self.assertEqual(r["publishedCount"], 1)
        self.assertEqual(public["assets"][0]["id"], a["id"])
        self.assertEqual(set(public["assets"][0]["renditions"]), {"screen", "print"})
        self.assertNotIn("promptText", public["assets"][0])
        self.assertNotIn("originalPath", public["assets"][0])

    def test_all_three_publication_requirements(self):
        for field, value in (("rightsStatus", "unknown"), ("reviewStatus", "rejected"), ("permissionToRedistribute", False)):
            a = self.manifest["assets"][0]
            a.update(rightsStatus="approved", reviewStatus="accepted", permissionToRedistribute=True, reviewer="QA")
            a[field] = value
            with self.subTest(field=field):
                r, _, _ = self.run_build()
                self.assertEqual(r["publishedCount"], 0)

    def test_print_ppi_uses_native_pixels_and_does_not_upscale(self):
        r, _, _ = self.run_build()
        v = r["assets"][0]["renditions"]["print"]
        self.assertEqual((v["width"], v["height"]), (320, 240))
        self.assertEqual(v["nativePpi"], 45.16)
        self.assertEqual(v["effectivePpi"], 45.16)
        self.assertFalse(v["meetsTarget"])
        self.assertFalse(v["upscaled"])

    def test_focal_crops_stay_inside_and_include_focal_pixel(self):
        for focal in ({"x": 0, "y": 0}, {"x": 1, "y": 1}, {"x": .75, "y": .5}):
            for ratio in (4 / 5, 16 / 9):
                x0, y0, x1, y1 = p.crop_box((320, 240), ratio, focal)
                self.assertTrue(0 <= x0 < x1 <= 320 and 0 <= y0 < y1 <= 240)
                self.assertTrue(x0 <= focal["x"] * 320 <= x1 and y0 <= focal["y"] * 240 <= y1)
                self.assertAlmostEqual((x1 - x0) / (y1 - y0), ratio, delta=.01)

    def test_zero_images(self):
        self.manifest["assets"] = []
        r, blobs, _ = self.run_build()
        self.assertEqual(r["errors"], [])
        self.assertEqual(json.loads(blobs["published-manifest.json"])["assets"], [])
        p.write_new(self.target, blobs, r)
        self.assertTrue((self.target / "contact-sheet.html").exists())

    def test_duplicate_ids_missing_strings_and_invalid_types(self):
        self.manifest["assets"][1]["id"] = self.manifest["assets"][0]["id"]
        self.manifest["assets"][0]["caption"] = "  "
        self.manifest["assets"][0]["focalPoint"] = {"x": True, "y": float("nan")}
        self.manifest["assets"][0]["permissionToRedistribute"] = "true"
        self.assertTrue({"duplicate_id", "missing_string", "focal_range", "boolean"} <= self.codes())

    def test_malformed_json_shapes_do_not_crash_validator(self):
        for bad in ([], None, {}, {"schemaVersion": "1.0", "assets": [None, [], {"id": [], "kind": [], "slots": [{}]}]}):
            with self.subTest(bad=bad):
                self.assertTrue(p.validate(bad))

    def test_dates_and_optional_supplied_renditions_are_validated(self):
        a = self.manifest["assets"][0]
        a["createdAt"] = "not-a-date"
        a["renditions"] = {"screen": {"path": "", "width": -1, "height": True}}
        self.assertTrue({"date_iso8601", "rendition_shape"} <= self.codes())

    def test_duplicate_original_hash(self):
        a, b = self.manifest["assets"]
        b["originalPath"], b["original"] = a["originalPath"], deepcopy(a["original"])
        r, blobs, _ = self.run_build()
        self.assertIn("duplicate_original_sha256", {e["code"] for e in r["errors"]})
        self.assertEqual(blobs, {})

    def test_parent_cycle_and_duplicate_derivation(self):
        a, b = self.manifest["assets"]
        a["parentAssetId"], b["parentAssetId"] = b["id"], a["id"]
        self.assertIn("parent_cycle", self.codes())
        c = deepcopy(b)
        c["id"] = "synthetic-002"
        a["parentAssetId"] = None
        self.manifest["assets"].append(c)
        self.assertIn("duplicate_derivation", self.codes())

    def test_ancestor_rights_cannot_be_bypassed(self):
        a, b = self.manifest["assets"]
        b.update(parentAssetId=a["id"], rightsStatus="approved", reviewStatus="accepted", permissionToRedistribute=True, reviewer="QA")
        r, _, _ = self.run_build()
        self.assertEqual(r["publishedCount"], 0)

    def test_corrupt_image_aborts_without_output(self):
        (self.source / self.manifest["assets"][1]["originalPath"]).write_bytes(b"broken")
        r, blobs, _ = self.run_build()
        self.assertIn("input_image", {e["code"] for e in r["errors"]})
        self.assertFalse(self.target.exists())
        self.assertEqual(blobs, {})

    def test_integrity_mismatch(self):
        self.manifest["assets"][0]["original"]["sha256"] = "0" * 64
        self.assertIn("mismatch", self.run_build()[0]["errors"][0]["message"])

    def test_path_escape_and_absolute_path_rejected(self):
        for path in ("../outside.png", str(self.source / "synthetic-000.png")):
            self.manifest["assets"][0]["originalPath"] = path
            with self.subTest(path=path):
                self.assertTrue(self.run_build()[0]["errors"])

    def test_existing_output_is_not_overwritten(self):
        self.target.mkdir()
        sentinel = self.target / "keep.txt"
        sentinel.write_text("keep")
        with self.assertRaisesRegex(ValueError, "exists"):
            p.build(self.args())
        with self.assertRaisesRegex(ValueError, "exists"):
            p.write_new(self.target, {"keep.txt": b"wrong"}, {})
        self.assertEqual(sentinel.read_text(), "keep")

    def test_output_overlap_is_rejected(self):
        for target in (self.source, self.source / "out", self.base):
            self.target = target
            with self.assertRaises(ValueError):
                p.build(self.args())

    def test_staging_failure_keeps_existing_data(self):
        sentinel = self.base / "keep.txt"
        sentinel.write_text("keep")
        with patch.object(p.os, "rename", side_effect=OSError("simulated rename failure")):
            with self.assertRaises(OSError):
                p.write_new(self.target, {"web/test.webp": b"data"}, {})
        self.assertEqual(sentinel.read_text(), "keep")
        self.assertFalse(self.target.exists())
        self.assertEqual(list(self.base.glob(".img-pipe-*")), [])

    def test_cli_default_dry_run_then_explicit_write(self):
        argv = ["--manifest", str(self.source / "intake.json"), "--input", str(self.source), "--output", str(self.target)]
        with contextlib.redirect_stdout(io.StringIO()) as stream:
            self.assertEqual(p.main(argv), 0)
        self.assertIn('"written": false', stream.getvalue())
        self.assertFalse(self.target.exists())
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(p.main(argv + ["--write"]), 0)
        report = json.loads((self.target / "report.json").read_text(encoding="utf-8"))
        self.assertTrue(report["written"])
        self.assertTrue((self.target / "thumbnails/contact-001.png").exists())

    def test_cli_bad_json_returns_nonzero_without_writing(self):
        (self.source / "intake.json").write_text("{bad json")
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(p.main(["--manifest", str(self.source / "intake.json"), "--input", str(self.source), "--output", str(self.target), "--write"]), 2)
        self.assertFalse(self.target.exists())

    def test_exif_orientation_and_metadata_stripped(self):
        a = self.manifest["assets"][0]
        image = Image.new("RGB", (320, 240), "blue")
        exif = Image.Exif()
        exif[274], exif[315] = 6, "PRIVATE ARTIST"
        image.save(self.source / a["originalPath"], exif=exif)
        a.pop("original")
        a["orientation"] = "portrait"
        r, blobs, _ = self.run_build()
        self.assertFalse(r["errors"])
        self.assertEqual(r["assets"][0]["original"]["height"], 320)
        for v in r["assets"][0]["renditions"].values():
            with Image.open(io.BytesIO(blobs[v["path"]])) as out:
                self.assertFalse(out.getexif())
                self.assertNotIn("xmp", out.info)

    def test_animated_image_rejected(self):
        a = self.manifest["assets"][0]
        frames = [Image.new("RGB", (320, 240), color) for color in ("blue", "red")]
        frames[0].save(self.source / a["originalPath"], save_all=True, append_images=frames[1:])
        r, _, _ = self.run_build()
        self.assertIn("single-frame", r["errors"][0]["message"])

    def test_100_patterns_and_error_examples(self):
        source100 = self.base / "input100"
        manifest = generate(source100, 100)
        self.source, self.manifest = source100, manifest
        r, blobs, _ = self.run_build()
        self.assertEqual(r["errors"], [])
        self.assertEqual(len(r["assets"]), 100)
        self.assertEqual(len([f for f in blobs if f.endswith(".webp")]), 300)
        self.assertEqual(len([f for f in blobs if f.startswith("thumbnails/")]), 5)
        self.assertEqual(r["publishedCount"], 0)
        self.manifest["assets"][1]["id"] = self.manifest["assets"][0]["id"]
        self.manifest["assets"][2]["owner"] = ""
        self.assertTrue({"duplicate_id", "missing_string"} <= self.codes())
        self.manifest = manifest = generate(self.base / "more100", 100)
        self.source = self.base / "more100"
        (self.source / manifest["assets"][99]["originalPath"]).write_bytes(b"corrupt")
        self.assertTrue(self.run_build()[0]["errors"])

    def test_invalid_options(self):
        for option, value in (("--quality", "101"), ("--screen-edge", "0"), ("--print-width-mm", "nan")):
            with self.subTest(option=option), self.assertRaises(ValueError):
                p.build(self.args(option, value))


if __name__ == "__main__":
    unittest.main(verbosity=2)
