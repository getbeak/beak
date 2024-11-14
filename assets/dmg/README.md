# DMG generation

## Steps

- Export PNG with dimensions 544x408 (regular)
- Export PNG with dimensions 1088x816 (retina)
- Run `tiffutil -cathidpicheck "bg@0.5x.png" "bg.png" -out background.tiff`

Simple!
