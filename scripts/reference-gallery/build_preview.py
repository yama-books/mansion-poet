#!/usr/bin/env python3
"""Prepare a standalone HTTP-served REF-GALLERY preview with only public REF files.

No repo mutation. Require --output pointing to a new or empty directory.
Never copy local secrets, prompt logs, or app/private configuration.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import sys
ROOT = Path(__file__).resolve().parents[2]
MANIFEST = "research/visual-reference-manifest.json"
ASSETS = [
 "tools/reference-gallery/index.html",
 "tools/reference-gallery/gallery.js",
 "tools/reference-gallery/gallery.css",
 "src/reference-gallery/gallery-model.js",
 MANIFEST,
]
PATH = re.compile(r"assets/reference-images/REF-\d{4}-(?:overview|[A-Z][0-9]?_[a-z0-9_]+)\.png")
SIZE_LIMIT=10*1024*1024

def png_info(data):
 if len(data)<24 or data[:8]!=b"\x89PNG\r\n\x1a\n" or data[12:16]!=b"IHDR":
  raise ValueError("Invalid PNG header")
 return struct.unpack(">II",data[16:24])

def validate(root=ROOT):
 manifest=json.loads((root/MANIFEST).read_text(encoding="utf8"))
 if manifest.get("schemaVersion")!="app003.reference-library.v1":
  raise ValueError("Unknown manifest version")
 if len(manifest.get("references",[]))<1:raise ValueError("No references")
 files=manifest.get("files",[])
 if not files:raise ValueError("No image records")
 result=[]
 seen=set()
 for f in files:
  path=f.get("plannedRepoPath")
  if (not isinstance(path,str) or not PATH.fullmatch(path) or path in seen):
   raise ValueError("Unsafe or duplicate file path: "+str(path))
  seen.add(path)
  if f.get("repoImageExists") is not True or f.get("binaryStatus")!="uploaded_verified":
   raise ValueError("Image not uploaded/verified: "+path)
  src=root/path
  data=src.read_bytes()
  if len(data)>SIZE_LIMIT or len(data)!=f["bytes"]:
   raise ValueError("Bad byte count: "+path)
  if png_info(data)!=(f["width"],f["height"]):
   raise ValueError("Wrong dimensions: "+path)
  if hashlib.sha256(data).hexdigest()!=f["sha256"]:
   raise ValueError("SHA mismatch: "+path)
  result.append(path)
 for ref in manifest["references"]:
  if ref.get("publishedAllowed") is not False:
   raise ValueError("REF gallery must not contain production-approved art")
 for p in ASSETS:
  if not (root/p).is_file():raise FileNotFoundError(p)
 return result

def build(output,root=ROOT):
 output=output.resolve()
 root=root.resolve()
 if output==root or output in root.parents:
  raise ValueError("Cannot replace repository or a repository ancestor")
 if output.exists() and any(output.iterdir()):
  raise FileExistsError("Preview destination must be new or empty: "+str(output))
 files=validate(root)
 output.mkdir(parents=True,exist_ok=True)
 for p in ASSETS+files:
  dest=output/p
  dest.parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(root/p,dest)
 (output/"index.html").write_text(
  '<!doctype html><html lang="ja"><meta charset="utf-8">'
  '<meta http-equiv="refresh" content="0;url=tools/reference-gallery/index.html">'
  '<title>APP-003 REFERENCE ATELIER</title>'
  '<a href="tools/reference-gallery/index.html">参考画像ギャラリーを開く</a></html>',
  encoding="utf8")
 print("PREVIEW READY:",len(files),"image files at",output)
 print("SERVE ROOT:",output)
 print("OPEN: http://127.0.0.1:8765/tools/reference-gallery/index.html")
 return len(files)

if __name__=="__main__":
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument("--output",required=True,type=Path)
 args=ap.parse_args()
 try: build(args.output)
 except (ValueError,FileExistsError,FileNotFoundError,OSError,KeyError) as exc:
  print("ERROR:",exc,file=sys.stderr)
  sys.exit(1)
