#!/usr/bin/env python3
"""Headless-Chrome renderer: HTML -> PNG screenshot or PDF print.
Each invocation gets a throwaway profile so runs never fight over a lock."""
import subprocess, sys, tempfile, shutil, os, time

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE = ["--headless=new", "--no-sandbox", "--hide-scrollbars",
        "--no-first-run", "--no-default-browser-check", "--disable-extensions",
        "--disable-background-networking", "--disable-sync", "--mute-audio",
        "--run-all-compositor-stages-before-draw"]
REDUCED = ["--force-prefers-reduced-motion"]
NOGPU   = ["--disable-gpu"]
# Software rasterizer so WebGL actually initializes in headless.
SWGL    = ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader",
           "--enable-webgl", "--ignore-gpu-blocklist"]

def run(args, timeout=20, out=None):
    """Chrome reliably writes the artifact then hangs instead of exiting, so we
    poll for the finished file and kill it rather than waiting on the process."""
    if out and os.path.exists(out):
        os.remove(out)          # never poll against a stale artifact
    prof = tempfile.mkdtemp(prefix="chr-")
    cmd = [CHROME] + BASE + [f"--user-data-dir={prof}"] + args
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        deadline = time.time() + timeout
        stable = 0
        last = -1
        while time.time() < deadline:
            if proc.poll() is not None:
                break
            if out and os.path.exists(out):
                sz = os.path.getsize(out)
                if sz > 1000 and sz == last:
                    stable += 1
                    if stable >= 3:      # size unchanged across 3 polls -> done
                        break
                else:
                    stable = 0
                last = sz
            time.sleep(0.25)
        return 0
    finally:
        try:
            os.killpg(os.getpgid(proc.pid), 9)
        except Exception:
            pass
        shutil.rmtree(prof, ignore_errors=True)

def shot(url, out, w, h, scale=2, wait=2500, transparent=False, motion=False, gpu=False):
    """motion=True drops the reduced-motion emulation so animations actually run;
    `wait` then doubles as the virtual-time budget, i.e. where on the timeline
    the frame is captured."""
    extra = ["--default-background-color=00000000"] if transparent else []
    if not motion:
        extra = extra + REDUCED
    extra = extra + (SWGL if gpu else NOGPU)
    return run(extra + [f"--force-device-scale-factor={scale}", f"--window-size={w},{h}",
                f"--virtual-time-budget={wait}", f"--screenshot={out}", url], out=out)

def pdf(url, out, wait=3000):
    return run(NOGPU + [f"--virtual-time-budget={wait}", "--no-pdf-header-footer",
                "--print-to-pdf-no-header", f"--print-to-pdf={out}", url], out=out, timeout=35)

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "shot":
        _, _, url, out, w, h, *rest = sys.argv
        sc = rest[0] if rest else "2"
        flags = set(rest[1:])
        # "motion" enables animation; "@<ms>" picks the moment on the timeline.
        at = next((int(f[1:]) for f in flags if f.startswith("@")), 2500)
        rc = shot(url, out, w, h, sc,
                  transparent=("transparent" in flags),
                  motion=("motion" in flags), gpu=("gpu" in flags), wait=at)
    else:
        _, _, url, out = sys.argv[:4]
        rc = pdf(url, out)
    ok = os.path.exists(out) and os.path.getsize(out) > 1000
    print(f"{'OK ' if ok else 'FAIL'} {out} rc={rc} "
          f"{os.path.getsize(out) if os.path.exists(out) else 0}B")
    sys.exit(0 if ok else 1)
