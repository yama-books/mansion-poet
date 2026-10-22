"""Verify the minimal reference-gallery preview packaging without accessing outside services."""
from __future__ import annotations
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/"scripts/reference-gallery/build_preview.py"
spec=importlib.util.spec_from_file_location("app003_gallery_build",SCRIPT)
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class GalleryBuildTests(unittest.TestCase):
 def test_all_registered_images_are_hashed_and_available(self):
  paths=builder.validate(ROOT)
  self.assertEqual(len(paths),19)
  self.assertEqual(len(set(paths)),19)
  self.assertTrue(all(p.startswith("assets/reference-images/REF-") for p in paths))

 def test_preview_contains_only_required_site_files(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)/"ref-preview"
   self.assertEqual(builder.build(out,ROOT),19)
   self.assertTrue((out/"tools/reference-gallery/index.html").is_file())
   self.assertTrue((out/"src/reference-gallery/gallery-model.js").is_file())
   self.assertTrue((out/"research/visual-reference-manifest.json").is_file())
   self.assertEqual(len(list((out/"assets/reference-images").glob("*.png"))),19)
   self.assertFalse((out/"docs").exists())
   self.assertFalse((out/".github").exists())

 def test_refuses_nonempty_destination(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)
   (out/"keep.txt").write_text("private",encoding="utf8")
   with self.assertRaises(FileExistsError):
    builder.build(out,ROOT)
   self.assertEqual((out/"keep.txt").read_text(),"private")

 def test_refuses_repository_root_as_output(self):
  with self.assertRaises(ValueError):
   builder.build(ROOT,ROOT)

if __name__=="__main__":unittest.main()
