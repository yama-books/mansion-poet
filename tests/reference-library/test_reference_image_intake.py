"""Offline verification for the APP-003 reference-image intake and manifest."""
from __future__ import annotations
import hashlib
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
import zlib

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts/reference-library/register_reference_images.py"
spec = importlib.util.spec_from_file_location("app003_ref_lib", SRC)
reg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reg)

def tiny_png():
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"\x00\x00\x00\x00"))
            + chunk(b"IEND", b""))

class ReferenceImageIntakeTests(unittest.TestCase):
    def test_image_header(self):
        self.assertEqual(reg.png_size(tiny_png()), (1,1))
        with self.assertRaises(ValueError):
            reg.png_size(b"not a PNG")

    def test_allowed_paths_exclude_traversal(self):
        self.assertTrue(reg.NAME.fullmatch("assets/reference-images/REF-0001-A_type_poem.png"))
        for path in ["../../secret.png", "assets/reference-images/../other.png",
                     "https://host/a.png", "assets/reference-images/REF-0001-X.png"]:
            self.assertIsNone(reg.NAME.fullmatch(path), path)

    def test_hash_and_dimensions_fail_closed(self):
        data = tiny_png()
        e = {"bytes":len(data), "sha256":hashlib.sha256(data).hexdigest(), "width":1, "height":1}
        reg.check_png(data, e, "fixture")
        with self.assertRaises(ValueError):
            reg.check_png(data + b"x", e, "tampered")
        with self.assertRaises(ValueError):
            reg.check_png(data, dict(e,width=2), "wrong dimensions")

    def test_manifest_has_two_origins_and_17_derived(self):
        m = reg.load_manifest(ROOT)
        self.assertEqual(len(m["files"]),19)
        self.assertEqual(len(m["references"]),2)
        self.assertEqual(sum(x["role"]=="overview" for x in m["files"]),2)
        self.assertTrue(all(x["plannedRepoPath"].startswith(reg.PREFIX) for x in m["files"]))
        self.assertTrue(all(r["publishedAllowed"] is False for r in m["references"]))

    def test_extract_preserves_existing_and_rejects_conflicts(self):
        data = tiny_png()
        rel = "assets/reference-images/REF-0001-overview.png"
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / rel
            reg.extract(Path(d),{rel:data})
            self.assertEqual(path.read_bytes(),data)
            reg.extract(Path(d),{rel:data})
            with self.assertRaises(FileExistsError):
                reg.extract(Path(d),{rel:b"different"})
            self.assertEqual(path.read_bytes(),data)

    def test_remote_readback_requires_commit_sha(self):
        with self.assertRaises(ValueError):
            reg.verify_remote({"files":[]},"main")

if __name__=="__main__":
    unittest.main()
