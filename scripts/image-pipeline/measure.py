"""Measure actual pipeline wall time and Windows process peak working set."""
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import platform
import sys
import time

import PIL
import pipeline


def peak_working_set():
    if os.name != "nt":
        return None

    class Memory(ctypes.Structure):
        _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [
            (name, ctypes.c_size_t) for name in ("PeakWorkingSetSize", "WorkingSetSize",
             "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage",
             "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage")]

    kernel, psapi = ctypes.WinDLL("kernel32", use_last_error=True), ctypes.WinDLL("psapi", use_last_error=True)
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Memory), wintypes.DWORD]
    counters = Memory()
    counters.cb = ctypes.sizeof(counters)
    if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
        raise ctypes.WinError(ctypes.get_last_error())
    return counters.PeakWorkingSetSize


if __name__ == "__main__":
    args = pipeline.parser().parse_args()
    start = time.perf_counter()
    report, blobs, rows = pipeline.build(args)
    if report["errors"]:
        print(pipeline.dumps(report))
        raise SystemExit(2)
    pipeline.package(report, blobs, rows)
    if args.write:
        print(pipeline.dumps({"plannedFiles": report["files"], "output": str(args.output)}), flush=True)
        report["written"] = True
        pipeline.write_new(args.output, blobs, report)
    peak = peak_working_set()
    stats = {"assetCount": len(report["assets"]), "publishedCount": report["publishedCount"],
             "elapsedSeconds": round(time.perf_counter() - start, 6),
             "peakWorkingSetBytes": peak, "peakWorkingSetMiB": round(peak / 1048576, 2) if peak else None,
             "memoryMetric": "Windows process lifetime PeakWorkingSetSize; includes Python and Pillow",
             "outputBytesExcludingReport": sum(f["bytes"] for f in report["files"]),
             "outputFileCountExcludingReport": len(report["files"]),
             "inputBytes": sum(a["original"]["bytes"] for a in report["assets"]),
             "python": sys.version.split()[0], "pillow": PIL.__version__, "platform": platform.platform(),
             "written": args.write, "warnings": len(report["warnings"])}
    print(pipeline.dumps(stats))
