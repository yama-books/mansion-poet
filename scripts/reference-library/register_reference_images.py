#!/usr/bin/env python3
"""APP-003 REF-LIB-02: safe ZIP import and immutable GitHub binary readback.

Default runs are read-only. --extract writes *only* the known 19 PNGs to the
current reference-library worktree. --mark-verified is enabled only after all
19 remote PNGs are re-fetched by an immutable commit SHA and hash checked.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import sys
import tempfile
from urllib.request import Request, urlopen
import zipfile

MANIFEST = "research/visual-reference-manifest.json"
REPO = "yama-books/mansion-poet"
PREFIX = "assets/reference-images/"
MAX_FILE = 10 * 1024 * 1024
MAX_TOTAL = 40 * 1024 * 1024
PNG_SIG = b"\x89PNG\r\n\x1a\n"
NAME = re.compile(r"^assets/reference-images/REF-[0-9]{4}-(?:overview|[A-Z][0-9]?_[a-z0-9_]+)\.png$")
COMMIT = re.compile(r"^[0-9a-f]{40}$")

def png_size(data):
    if len(data) < 24 or not data.startswith(PNG_SIG) or data[12:16] != b"IHDR":
        raise ValueError("Not a valid PNG header")
    w, h = struct.unpack(">II", data[16:24])
    if not (0 < w <= 20000 and 0 < h <= 20000):
        raise ValueError("Bad PNG dimensions")
    return w, h

def check_png(data, record, where):
    if len(data) != record["bytes"]:
        raise ValueError(f"{where}: byte count mismatch")
    if hashlib.sha256(data).hexdigest() != record["sha256"]:
        raise ValueError(f"{where}: SHA-256 mismatch")
    if png_size(data) != (record["width"], record["height"]):
        raise ValueError(f"{where}: image dimensions mismatch")

def load_manifest(root):
    with (root / MANIFEST).open(encoding="utf-8") as f:
        m = json.load(f)
    if m.get("schemaVersion") != "app003.reference-library.v1":
        raise ValueError("Unexpected manifest schema")
    if m.get("counts") != {"sourceImages": 2, "derivedCrops": 17, "imagesTotal": 19}:
        raise ValueError("Unexpected image counts; update contract before extending")
    rows = m.get("files")
    if not isinstance(rows, list) or len(rows) != 19:
        raise ValueError("Expected 19 manifest files")
    names = set()
    for a in rows:
        path = a.get("plannedRepoPath")
        if not isinstance(path, str) or not NAME.fullmatch(path) or path in names:
            raise ValueError(f"Unsafe/duplicate manifest path: {path}")
        names.add(path)
        digest = a.get("sha256")
        if not isinstance(digest, str) or not re.fullmatch("[0-9a-f]{64}", digest):
            raise ValueError(f"Bad hash: {path}")
        if not (0 < a.get("bytes", 0) <= MAX_FILE):
            raise ValueError(f"Bad size: {path}")
        if not (a["width"] > 0 and a["height"] > 0):
            raise ValueError(f"Bad dimensions: {path}")
        x0, y0, x1, y1 = a["cropBox"]
        if x1 - x0 != a["width"] or y1 - y0 != a["height"]:
            raise ValueError(f"Bad crop box: {path}")
    if sum(a["bytes"] for a in rows) > MAX_TOTAL:
        raise ValueError("Image size budget exceeded")
    if len(set(a["id"] for a in rows)) != 19:
        raise ValueError("Duplicate asset ID")
    return m

def read_zip(archive, manifest):
    rows = {a["plannedRepoPath"]: a for a in manifest["files"]}
    with zipfile.ZipFile(archive) as z:
        pngs = [x for x in z.namelist() if x.lower().endswith(".png")]
        if len(pngs) != 19 or set(pngs) != set(rows):
            raise ValueError("Archive PNG paths must equal the 19 manifest paths")
        if sum(z.getinfo(x).file_size for x in pngs) > MAX_TOTAL:
            raise ValueError("Excessive uncompressed PNG size")
        inv = json.loads(z.read("image-inventory.json"))
        indexed = {a["path"]: a for a in inv["files"]}
        if set(indexed) != set(rows):
            raise ValueError("Archive inventory does not match")
        blobs = {}
        for path, rec in rows.items():
            if z.getinfo(path).file_size != rec["bytes"]:
                raise ValueError(f"ZIP entry size mismatch: {path}")
            other = indexed[path]
            if other["sha256"] != rec["sha256"] or other["dimensions"] != [rec["width"], rec["height"]]:
                raise ValueError(f"Inventory disagrees: {path}")
            data = z.read(path)
            check_png(data, rec, path)
            blobs[path] = data
        return blobs

def extract(root, blobs):
    # Verify all potential name collisions before writing any file.
    for path, data in blobs.items():
        out = root / path
        if out.exists() and out.read_bytes() != data:
            raise FileExistsError(f"Refusing to overwrite existing different file: {out}")
    for path, data in sorted(blobs.items()):
        out = root / path
        if out.exists():
            print("UNCHANGED", path)
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=".app003-ref-", dir=out.parent)
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(data)
            os.replace(tmp, out)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
        print("EXTRACTED", path)

def verify_local(root, manifest):
    for row in manifest["files"]:
        path = root / row["plannedRepoPath"]
        check_png(path.read_bytes(), row, str(path))
    print("LOCAL VERIFIED: 19/19 byte lengths, PNG dimensions and SHA-256")

def verify_remote(manifest, sha):
    if not COMMIT.fullmatch(sha):
        raise ValueError("Remote ref must be an immutable 40-hex commit SHA")
    for row in manifest["files"]:
        path = row["plannedRepoPath"]
        url = f"https://raw.githubusercontent.com/{REPO}/{sha}/{path}"
        request = Request(url, headers={"User-Agent": "APP003-REF-LIB-02"})
        with urlopen(request, timeout=25) as response:
            data = response.read(MAX_FILE + 1)
        check_png(data, row, url)
        print("REMOTE VERIFIED", path)
    print("REMOTE VERIFIED: 19/19 byte lengths, PNG dimensions and SHA-256")

def mark_verified(root, manifest, sha):
    # Caller must first complete verify_remote(...) without error.
    for rec in manifest["files"]:
        rec["binaryStatus"] = "uploaded_verified"
        rec["repoImageExists"] = True
    manifest["storage"]["status"] = "uploaded_verified"
    manifest["storage"]["binaryRepoUploadVerified"] = True
    manifest["storage"]["verifiedCommitSha"] = sha
    manifest["storage"]["note"] = (
        "All 19 GitHub PNG binaries verified at immutable commit. "
        "Still REF only, NOT approved production ART."
    )
    target = root / MANIFEST
    fd, tmp = tempfile.mkstemp(prefix=".app003-manifest-", dir=target.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp, target)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    print("MANIFEST UPDATED: verified image binaries; publishedAllowed remains false")

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--repo-root", type=Path, default=Path.cwd())
    p.add_argument("--archive", type=Path, help="path to original ZIP in user's own filesystem")
    p.add_argument("--extract", action="store_true", help="write verified PNGs to this worktree")
    p.add_argument("--verify-local", action="store_true")
    p.add_argument("--remote-ref", help="commit SHA after PNGs were pushed to GitHub")
    p.add_argument("--mark-verified", action="store_true", help="update manifest only after remote verification")
    a = p.parse_args()
    if a.extract and not a.archive:
        p.error("--extract requires --archive")
    if a.mark_verified and not a.remote_ref:
        p.error("--mark-verified requires --remote-ref")
    root = a.repo_root.resolve()
    manifest = load_manifest(root)
    if a.archive:
        blobs = read_zip(a.archive.resolve(), manifest)
        print("ZIP VERIFIED:", len(blobs), "files")
        if a.extract:
            extract(root, blobs)
    if a.verify_local or a.extract:
        verify_local(root, manifest)
    if a.remote_ref:
        verify_remote(manifest, a.remote_ref)
        if a.mark_verified:
            mark_verified(root, manifest, a.remote_ref)
    if not (a.archive or a.verify_local or a.remote_ref):
        print("MANIFEST VERIFIED: 19 image records; storage:", manifest["storage"]["status"])

if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, zipfile.BadZipFile, json.JSONDecodeError) as ex:
        print("ERROR:", ex, file=sys.stderr)
        sys.exit(1)
