"""PRINT03-CORE PDF checker (local QA only, needs PyMuPDF).

Usage: python -P check_pdf.py <pdf> <required.json> [<png_prefix>]
Prints JSON: page count, page sizes in mm, required strings missing from the PDF
text layer, text spans outside the paper, and optional PNG renders per page.
"""
import json
import re
import sys

try:
    import pymupdf
except ImportError:  # PyMuPDF < 1.24
    import fitz as pymupdf

PT_TO_MM = 25.4 / 72


def squash(s):
    return re.sub(r"\s+", "", s)


def main():
    pdf, req_path = sys.argv[1], sys.argv[2]
    png_prefix = sys.argv[3] if len(sys.argv) > 3 else None
    with open(req_path, encoding="utf-8") as f:
        required = json.load(f)
    doc = pymupdf.open(pdf)
    text = ""
    sizes = []
    outside = []
    pngs = []
    for i, page in enumerate(doc):
        r = page.rect
        sizes.append([round(r.width * PT_TO_MM, 1), round(r.height * PT_TO_MM, 1)])
        text += page.get_text("text")
        for b in page.get_text("dict")["blocks"]:
            for line in b.get("lines", []):
                for span in line["spans"]:
                    x0, y0, x1, y1 = span["bbox"]
                    if span["text"].strip() and (x0 < -0.5 or y0 < -0.5 or x1 > r.width + 0.5 or y1 > r.height + 0.5):
                        outside.append({"page": i + 1, "text": span["text"][:40]})
        if png_prefix:
            out = f"{png_prefix}-p{i + 1}.png"
            page.get_pixmap(dpi=72).save(out)
            pngs.append(out)
    all_text = squash(text)
    missing = [s for s in required if squash(s) not in all_text]
    fonts = sorted({f[3] for p in doc for f in p.get_fonts()})
    print(json.dumps({"pageCount": doc.page_count, "pageSizesMm": sizes, "missing": missing,
                      "outside": outside, "fonts": fonts, "pngs": pngs}, ensure_ascii=False))


if __name__ == "__main__":
    main()
