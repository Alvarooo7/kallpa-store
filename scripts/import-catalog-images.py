"""Optimize the selected local photographs without cropping or upscaling."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
inventory = json.loads((ROOT / 'scripts' / 'image-inventory.json').read_text(encoding='utf-8'))
existing = json.loads((ROOT / 'src' / 'lib' / 'catalog-images.json').read_text(encoding='utf-8'))
selection = {
    'lenovo-xt80': [29, 31, 32, 30, 33],
    'acuaticos-x7': [7, 9, 12, 13, 16, 22],
    'erazer-xf21': [27, 24, 26, 25, 28],
    'haylou-rs4-plus': [37, 34, 35, 36, 38],
    'zeblaze-stratos-2-ultra': [42, 44, 47, 40, 39, 43, 50],
    'blackview-bv200': [0, 2, 1],
    'microwear-w-ai-3': [6, 5, 4],
}
manifest = {}
primary_photos = {
    'lenovo-xt80': (Path('C:/Users/INTEL/Pictures/Vendemia/audifonos/xt80/xt80.png'), 'Lenovo XT80 negros con ganchos deportivos y estuche thinkplus'),
    'acuaticos-x7': (Path('C:/Users/INTEL/Pictures/Vendemia/audifonos/Acuativos X7/71UoRCokO4L.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg'), 'Audífonos acuáticos POLVCDG X7 de conducción ósea en negro y rojo'),
}
alts = {photo['src']: photo['alt'] for photos in existing.values() for photo in photos}
for slug, indices in selection.items():
    dest = ROOT / 'public' / 'products' / slug
    dest.mkdir(parents=True, exist_ok=True)
    images = []
    if slug in primary_photos:
        source, alt = primary_photos[slug]
        im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        im.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
        im.save(dest / 'studio.webp', 'WEBP', quality=95, method=6)
        thumb = im.copy()
        thumb.thumbnail((480, 480), Image.Resampling.LANCZOS)
        thumb.save(dest / 'studio-thumb.webp', 'WEBP', quality=90, method=6)
        images.append({'src': f'/products/{slug}/studio.webp', 'width': im.width, 'height': im.height, 'alt': alt})
    for number, index in enumerate(indices, 1):
        source = Path(inventory[index]['path'])
        filename = f'{number:02}.webp'
        if not source.exists() and (dest / filename).exists():
            images.append(next(photo for photo in existing[slug] if photo['src'] == f'/products/{slug}/{filename}'))
            continue
        im = ImageOps.exif_transpose(Image.open(source))
        if im.mode == 'RGBA':
            canvas = Image.new('RGBA', im.size, 'white')
            im = Image.alpha_composite(canvas, im)
        im = im.convert('RGB')
        im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        im.save(dest / filename, 'WEBP', quality=90, method=6)
        thumb = im.copy()
        thumb.thumbnail((480, 480), Image.Resampling.LANCZOS)
        thumb.save(dest / f'{number:02}-thumb.webp', 'WEBP', quality=85, method=6)
        images.append({'src': f'/products/{slug}/{filename}', 'width': im.width, 'height': im.height,
                       'alt': alts[f'/products/{slug}/{filename}']})
    manifest[slug] = images
(ROOT / 'src' / 'lib' / 'catalog-images.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Imported {sum(map(len, manifest.values()))} photographs for {len(manifest)} products.')
