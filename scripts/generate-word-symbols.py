"""Build transparent vector symbols from installed Windows font outlines."""
import json
import unicodedata
import shutil
import hashlib
from pathlib import Path
from fontTools.ttLib import TTFont, TTCollection
from fontTools.unicodedata import block
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'gui/assets/WordSymbols'
OUT.mkdir(parents=True, exist_ok=True)
catalog = {}
glyph_sets = {}
manifest = []
font_dir = OUT / 'fonts'
font_dir.mkdir(exist_ok=True)
def copy_font(filename):
    source = Path('C:/Windows/Fonts') / filename
    shutil.copy2(source, font_dir / filename)
    manifest.append({'file': filename, 'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
ranges = [
    (0x20A0, 0x20CF, 'Currency Symbols'), (0x2190, 0x21FF, 'Arrows'),
    (0x2200, 0x22FF, 'Mathematical Operators'), (0x2300, 0x23FF, 'Technical Symbols'),
    (0x2460, 0x24FF, 'Enclosed Characters'), (0x2500, 0x257F, 'Box Drawing'),
    (0x2580, 0x259F, 'Block Elements'), (0x25A0, 0x25FF, 'Geometric Shapes'),
    (0x2600, 0x26FF, 'Miscellaneous Symbols'), (0x2700, 0x27BF, 'Dingbats'),
    (0x2000, 0x206F, 'General Punctuation'), (0x2100, 0x214F, 'Letterlike Symbols'),
    (0x2150, 0x218F, 'Number Forms'), (0x0370, 0x03FF, 'Greek and Coptic'),
    (0x27C0, 0x2AFF, 'Supplemental Mathematics and Arrows'),
    (0x1D100, 0x1D1FF, 'Musical Symbols'),
]

def write_glyph(font, glyph, key):
    if id(font) not in glyph_sets:
        glyph_sets[id(font)] = font.getGlyphSet()
    glyphs = glyph_sets[id(font)]
    bounds = BoundsPen(glyphs)
    glyphs[glyph].draw(bounds)
    if not bounds.bounds:
        return None
    x0, y0, x1, y1 = bounds.bounds
    if x1 <= x0 or y1 <= y0:
        return None
    pen = SVGPathPen(glyphs)
    glyphs[glyph].draw(pen)
    pad = max(x1-x0, y1-y0) * .08
    width, height = x1-x0+pad*2, y1-y0+pad*2
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{x0-pad} {-y1-pad} {width} {height}"><path fill="#000" transform="scale(1,-1)" d="{pen.getCommands()}"/></svg>'
    (OUT / f'{key}.svg').write_text(svg, encoding='utf-8')
    return f'assets/WordSymbols/{key}.svg'

seen = set()
fonts = []
for filename in ['seguisym.ttf', 'cambria.ttc', 'arial.ttf', 'ARIALUNI.TTF', 'seguihis.ttf', 'seguiemj.ttf']:
    copy_font(filename)
    if filename.lower().endswith('.ttc'):
        fonts.extend(TTCollection('C:/Windows/Fonts/' + filename).fonts)
    else:
        fonts.append(TTFont('C:/Windows/Fonts/' + filename))
TTFont('C:/Windows/Fonts/cambria.ttc', fontNumber=1).save(font_dir / 'CambriaMath.ttf')
for font in fonts:
    for cp, glyph in sorted((font.getBestCmap() or {}).items()):
        if cp in seen or unicodedata.category(chr(cp)).startswith(('C', 'Z')):
            continue
        category = next((name for lo, hi, name in ranges if lo <= cp <= hi), None)
        if category is None:
            category = block(chr(cp))
        src = write_glyph(font, glyph, f'unicode_{cp:04X}')
        if src:
            catalog.setdefault(category, []).append({'name': f'{unicodedata.name(chr(cp), "Symbol")} · U+{cp:04X}', 'codepoint': cp, 'src': src})
            seen.add(cp)

for filename, category in [('symbol.ttf', 'Symbol'), ('wingding.ttf', 'Wingdings'), ('WINGDNG2.TTF', 'Wingdings 2'), ('WINGDNG3.TTF', 'Wingdings 3'), ('webdings.ttf', 'Webdings')]:
    copy_font(filename)
    font = TTFont('C:/Windows/Fonts/' + filename)
    table = next(t for t in font['cmap'].tables if t.platformID == 3 and t.platEncID == 0)
    for cp, glyph in sorted(table.cmap.items()):
        src = write_glyph(font, glyph, f'{category.replace(" ", "")}_{cp:04X}')
        if src:
            catalog.setdefault(category, []).append({'name': f'{category} · {cp & 255:02X}', 'codepoint': cp, 'src': src})

data = [{'name': name, 'symbols': sorted(symbols, key=lambda s: s['codepoint'])} for name, symbols in catalog.items()]
(ROOT / 'gui/word-symbols.js').write_text('window.WordSymbols = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Generated {sum(len(f["symbols"]) for f in data)} symbols across {len(data)} categories')
