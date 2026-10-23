#!/usr/bin/env python3
"""Validate & optionally extract seven ASSET-REF-02 reference PNGs from conversation ZIP.

No replacement of pre-existing files, no GitHub push, and no manifest promotion.
Usage:
 python scripts/reference-library/verify_asset_ref02_zip.py \
  /path/to/APP003_ASSET_REF_02_six_sheets.zip [--extract]
"""
import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path
from zipfile import ZipFile

OVERVIEW = {
    "fileName": "ASSET-REF-02_six-sheet_overview.png",
    "sha256": "3a9220239aac6ddc5c94c07de30b1846ba2f5a98de5640cb6092fc3e9a87f505",
    "width": 1884,
    "height": 1816,
}
ARCHIVE_SHA256 = "eb89f50049d521e6b251a8ca42094cd011ee323184af9eb262e54fb43cd8109e"

def check_png(data, record):
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError(f"Invalid PNG: {record['fileName']}")
    w, h = struct.unpack(">II", data[16:24])
    if (w, h) != (record["width"], record["height"]):
        raise ValueError(f"Wrong PNG dimensions: {record['fileName']}: {w}x{h}")
    digest = hashlib.sha256(data).hexdigest()
    if digest != record["sha256"]:
        raise ValueError(f"Wrong SHA256: {record['fileName']}")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("zip_file", type=Path)
    p.add_argument("--extract", action="store_true")
    args = p.parse_args()
    root = Path(__file__).resolve().parents[2]
    manifest = json.loads((root / "research/asset-ref-02-manifest-candidate.json").read_text(encoding="utf-8"))
    entries = manifest["sheets"] + [OVERVIEW]
    destination = root / "assets/reference-images"
    archive = args.zip_file.read_bytes()
    if hashlib.sha256(archive).hexdigest() != ARCHIVE_SHA256:
        raise ValueError("ZIP checksum mismatch: use the exact original conversation ZIP")
    checked = []
    with ZipFile(args.zip_file) as z:
        for item in entries:
            fname = item["fileName"]
            data = z.read("ASSET-REF-02/" + fname)
            check_png(data, item)
            checked.append((fname, data))
    if args.extract:
        for fname, _ in checked:
            if (destination / fname).exists():
                raise FileExistsError(f"Refusing to overwrite {destination / fname}")
        destination.mkdir(parents=True, exist_ok=True)
        for fname, data in checked:
            (destination / fname).write_bytes(data)
    for fname, data in checked:
        print("PASS", fname, len(data), "bytes")
    print(f"PASS {len(checked)}/{len(entries)} PNG; extracted={args.extract}; NO GIT PUSH")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, FileNotFoundError, FileExistsError, RuntimeError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
