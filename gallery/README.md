# Drop your gallery photos here

The Gallery page needs **3 to 5 photographs, and they must be your own** — the
assignment calls out copyright directly, so no stock and nothing off Google.

Put the files in this folder, then:

1. **Media → Add New** in WordPress and upload them.
2. Build the gallery in your gallery plugin (Modula, Envira, FooGallery…).
3. Copy the shortcode into the Gallery page, replacing
   `((GALLERY SHORTCODE GOES HERE))` in `content/gallery.html`.
4. Write the five one-line captions in that same file.

**Before uploading:** resize anything over ~2500px wide and re-save as JPG at
about 80% quality. Straight-off-the-phone photos are often 5–8 MB each, which
makes the page slow and can hit your host's upload limit.

macOS can do it without any extra software:

```bash
sips -Z 2000 *.jpg          # cap the long edge at 2000px, in place
```
