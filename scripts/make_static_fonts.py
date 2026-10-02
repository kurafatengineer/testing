"""Make the static font files the JavaScript poster renderer needs.

The vector renderer cannot pick a weight out of a variable font, so this writes one
static file per weight used by the posters (Plus Jakarta Sans 200/500/600/700/800),
with a unique family name each (PJS200 ...), plus renamed copies of Bebas Neue and
Poppins Black. Usage:  pip install fonttools && python scripts/make_static_fonts.py OUT_DIR
"""
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts-source")
OUT = sys.argv[1] if len(sys.argv) > 1 else "fonts_static"
os.makedirs(OUT, exist_ok=True)


def rename(font, family):
    for rec in font["name"].names:
        if rec.nameID in (1, 4, 16):
            rec.string = family
        elif rec.nameID == 6:
            rec.string = family.replace(" ", "")
        elif rec.nameID in (2, 17):
            rec.string = "Regular"
    font["OS/2"].usWeightClass = 400  # look fonts up by family name only


for w in (200, 500, 600, 700, 800):
    f = instancer.instantiateVariableFont(TTFont(os.path.join(SRC, "PlusJakartaSans.ttf")), {"wght": w})
    rename(f, f"PJS{w}")
    f.save(os.path.join(OUT, f"PJS{w}.ttf"))

for src, family, out in (("BebasNeue-Regular.ttf", "BebasX", "BebasNeue.ttf"),
                         ("Poppins-Black.ttf", "PoppinsBlackX", "Poppins-Black.ttf")):
    f = TTFont(os.path.join(SRC, src))
    rename(f, family)
    f.save(os.path.join(OUT, out))
print("wrote", sorted(os.listdir(OUT)))
