# Gallery photos

Three of your own photos, ready to upload:

| File | Size | Used on |
|---|---|---|
| `reno-sunset.jpg` | 2000×1500 | Gallery 01, About Me ("Where I am now"), home |
| `treenet.jpg` | 1500×2000 | Gallery 02, About Me ("Beyond the screen"), home |
| `dye-is-life.jpg` | 2000×1500 | Gallery 03, home |

**These copies are already prepared.** They are resized to a 2000px long edge,
saved at ~80% JPEG quality (0.7–1.1 MB each instead of 2–6 MB), and **stripped of
all metadata, including the GPS location** your phone embeds in every photo.
Upload these, not the originals from your camera roll.

Upload order for the gallery plugin matches the numbered captions in
`content/gallery.html`: sunset, treenet, Dye is Life.

The theme also bundles 1200px copies in `theme/roman-heuser/assets/img/life/`
for the home page's "Off the clock" strip.

## Adding a fourth or fifth photo

The rubric allows 3 to 5. For each new one, from this folder:

```bash
sips -Z 2000 -s format jpeg -s formatOptions 80 ~/Downloads/new.jpg --out new-photo.jpg
```

`sips` does **not** remove GPS data. Before uploading, open the copy in Preview →
Tools → Show Inspector → (i) → GPS tab → **Remove Location Info**, or ask Claude
to run the metadata strip on it.
