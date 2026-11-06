#!/usr/bin/env python3
"""Generate ReproShot extension icons (16/32/48/128).

A rounded indigo badge with a white camera-viewfinder bracket and a red
capture dot. Recognizable down to 16px. No external assets.
"""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "extension", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (47, 74, 170)        # deep indigo
BG2 = (79, 124, 255)      # accent
WHITE = (255, 255, 255)
DOT = (255, 45, 85)       # red capture dot


def rounded(size):
    S = size * 4  # supersample for crisp edges
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rad = int(S * 0.22)
    # vertical two-tone background
    bg = Image.new("RGBA", (S, S), BG + (255,))
    top = Image.new("RGBA", (S, S), BG2 + (255,))
    mask = Image.new("L", (S, S), 0)
    for y in range(S):
        a = int(90 * (1 - y / S))
        ImageDraw.Draw(mask).line([(0, y), (S, y)], fill=a)
    bg = Image.composite(top, bg, mask)
    # rounded mask
    rmask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(rmask).rounded_rectangle([0, 0, S - 1, S - 1], radius=rad, fill=255)
    img.paste(bg, (0, 0), rmask)

    d = ImageDraw.Draw(img)
    lw = max(2, int(S * 0.055))
    m = int(S * 0.27)        # bracket margin
    arm = int(S * 0.16)      # bracket arm length
    far = S - m
    # four viewfinder corners
    corners = [
        [(m, m + arm), (m, m), (m + arm, m)],
        [(far - arm, m), (far, m), (far, m + arm)],
        [(m, far - arm), (m, far), (m + arm, far)],
        [(far - arm, far), (far, far), (far, far - arm)],
    ]
    for pts in corners:
        d.line(pts, fill=WHITE, width=lw, joint="curve")
    # center capture dot
    r = int(S * 0.11)
    c = S // 2
    d.ellipse([c - r, c - r, c + r, c + r], fill=DOT)

    return img.resize((size, size), Image.LANCZOS)


for s in (16, 32, 48, 128):
    rounded(s).save(os.path.join(OUT, f"icon{s}.png"))
    print("wrote", f"icon{s}.png")
