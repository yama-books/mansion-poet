"""PRINT03-CORE: side-by-side comparison sheet of the three templates.

Usage: python -P make_compare_sheet.py <qa-output-dir>
Reads <template>__<fixture>.pdf files produced by run-browser-qa.mjs and writes
compare-sheet.pdf (one A3-landscape page per fixture, every page of each
template shown in its column) plus compare-sheet-<n>.png previews.
"""
import glob
import os
import sys

try:
    import pymupdf
except ImportError:  # PyMuPDF < 1.24
    import fitz as pymupdf

TEMPLATES = ["type_poem", "editorial", "location"]


def main():
    out = sys.argv[1]
    fixtures = sorted({os.path.basename(p).split("__")[1].removesuffix(".pdf")
                       for p in glob.glob(os.path.join(out, "type_poem__*.pdf")) if "__fontfail" not in p})
    sheet = pymupdf.open()
    W, H = 1191, 842  # A3 landscape in pt
    for fx in fixtures:
        page = sheet.new_page(width=W, height=H)
        page.insert_text((24, 30), f"PRINT03 compare — {fx} (test data)", fontsize=12)
        col_w = (W - 48) / 3
        for c, t in enumerate(TEMPLATES):
            path = os.path.join(out, f"{t}__{fx}.pdf")
            if not os.path.exists(path):
                continue
            src = pymupdf.open(path)
            n = src.page_count
            x0 = 24 + c * col_w
            page.insert_text((x0, 52), f"{t}  ({n} page{'s' if n > 1 else ''})", fontsize=10)
            thumb_w = min((col_w - 12) / n, (H - 80) / 1.414)
            for i in range(n):
                r = pymupdf.Rect(x0 + i * thumb_w, 62, x0 + (i + 1) * thumb_w - 4, 62 + thumb_w * 1.414)
                page.draw_rect(r, color=(0.6, 0.6, 0.6), width=0.4)
                page.show_pdf_page(r, src, i)
    target = os.path.join(out, "compare-sheet.pdf")
    sheet.save(target)
    for i, p in enumerate(sheet):
        p.get_pixmap(dpi=60).save(os.path.join(out, f"compare-sheet-{i + 1}.png"))
    print(target, sheet.page_count)


if __name__ == "__main__":
    main()
