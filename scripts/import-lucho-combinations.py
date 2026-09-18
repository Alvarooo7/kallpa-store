"""Copy generated hero portraits into the project and preserve alpha in WebP."""
import json
import shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
sources = json.loads((root / 'scripts/lucho-combination-sources.json').read_text(encoding='utf-8'))
for mask, source in sources.items():
    dest = root / 'public/hero' / f'lucho-combination-{mask}'
    if dest.with_suffix('.webp').exists():
        continue
    shutil.copyfile(source, dest.with_suffix('.png'))
    im = Image.open(dest.with_suffix('.png'))
    assert im.mode == 'RGBA' and im.size == (1024, 1536), 'Unexpected portrait dimensions or missing alpha'
    im.save(dest.with_suffix('.webp'), 'WEBP', quality=95, method=6)
    print(f'Combination {mask}: {im.size}, transparency preserved.', flush=True)
