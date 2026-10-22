"""Generate tiny artificial inputs; never fetch or generate property photographs."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw


def fixture_asset(i):
    aid = f"synthetic-{i:03}"
    return {"id": aid, "sceneId": f"scene-{i:03}", "variantId": "original", "parentAssetId": None,
            "group": "synthetic_geometry", "themes": ["architecture"], "slots": ["hero", "residence", "print_hero"],
            "orientation": "landscape", "focalPoint": {"x": 0.75, "y": 0.5},
            "kind": "generated_illustration", "caption": "架空建築イメージ・人工テスト図形",
            "rightsStatus": "review_required", "reviewStatus": "candidate", "reviewer": "",
            "owner": "test fixture author", "license": "synthetic test only",
            "sourceURL": "urn:app003:synthetic-fixture", "createdAt": "2026-10-20",
            "sourceRetrievedAt": "2026-10-20", "assetScope": "synthetic_test_only",
            "permissionToRedistribute": False, "imageShowsRealPOI": False,
            "generationTool": "Pillow geometric fixture generator", "generatedAt": "2026-10-20",
            "sourcePromptId": "SYNTHETIC-01", "promptRecipeId": "SYNTHETIC-01",
            "promptText": "Artificial rectangles, no real property", "provenance": "assistant_generated",
            "noticeType": ["fictional_architecture", "test_only"], "reviewNotes": "Pending crop/rights review",
            "rejectionReasons": [], "prohibitedTags": [], "originalPath": f"{aid}.png"}


def generate(root, count=10):
    root = Path(root)
    root.mkdir(parents=True, exist_ok=False)
    assets = []
    for i in range(count):
        a = fixture_asset(i)
        image = Image.new("RGB", (320, 240), (20 + i % 200, 40, 70))
        draw = ImageDraw.Draw(image)
        draw.rectangle((206, 45, 270, 220), fill=(170, 180, 150), outline="white", width=2)
        draw.line((240, 0, 240, 239), fill="red", width=2)
        draw.line((0, 120, 319, 120), fill="red", width=2)
        draw.text((8, 8), f"SYNTHETIC {i:03} / NOT A PROPERTY", fill="white")
        path = root / a["originalPath"]
        image.save(path)
        a["original"] = {"width": 320, "height": 240, "bytes": path.stat().st_size,
                         "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        assets.append(a)
    manifest = {"schemaVersion": "1.0", "assets": assets}
    (root / "intake.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--count", type=int, default=10)
    args = parser.parse_args()
    if not 0 <= args.count <= 100:
        parser.error("count must be 0..100")
    generate(args.output, args.count)
