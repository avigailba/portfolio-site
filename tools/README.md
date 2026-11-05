# Helper scripts (not part of the site, never copied into dist)

Her Mac has no PIL and no poppler (`pdftoppm`), so these use what macOS ships. Run them from the repo root.

- `nocache_server.py`: local preview that sends `Cache-Control: no-store`, so Chrome never shows a stale copy. Copy `dist` somewhere, then `python3 tools/nocache_server.py 8801 <copy of dist>`. Use a fresh port after big changes.
- `render.swift`: render PDF pages to PNG. `swift tools/render.swift file.pdf outdir` prints the page count; add `from to` (two separate arguments) to render pages.
- `search.swift`: list the PDF pages that contain keywords (edit the `keys` list at the top). `swift tools/search.swift file.pdf`.
- `cover.swift`: paint a rectangle over part of a screenshot using a sampled background colour. Args: `in out sampleX sampleY rectX rectY rectW rectH`.

Cropping and converting images: use the built-in `sips`, for example `sips --cropOffset <y> <x> -c <h> <w> in.png --out out.png`.
