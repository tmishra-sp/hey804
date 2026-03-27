#!/usr/bin/env python3
"""Generate QR code PNGs for Hey804 demo posters."""

import qrcode
from pathlib import Path

BASE_URL = "https://hey804-production.up.railway.app"

LOCATIONS = {
    "southside": {
        "name": "Southside Community Services",
        "address": "4100 Hull Street Road",
    },
    "downtown-library": {
        "name": "Richmond Public Library",
        "address": "101 E. Franklin Street",
    },
    "city-hall": {
        "name": "City Hall",
        "address": "900 E. Broad Street",
    },
}

output_dir = Path(__file__).parent

for slug, info in LOCATIONS.items():
    url = f"{BASE_URL}/?location={slug}"
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#003366", back_color="white")
    path = output_dir / f"qr_{slug.replace('-', '_')}.png"
    img.save(str(path))
    print(f"Generated: {path.name} -> {url}")

print(f"\nDone. Open posters/poster_template.html in a browser to print.")
