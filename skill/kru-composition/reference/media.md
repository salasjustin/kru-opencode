# Media

## An image the design depends on is real before the design is judged

**Default it corrects:** a grey box or a stock stand-in drawn with the plan to swap in a phone photo later — the design is judged on the stand-in, and the swap never looks like it.
**Rule:** an image slot is filled with the real asset or one pre-sourced for it (the designer produces them and paths land in the build spec). A slot with nothing yet is drawn empty and named as a gap in the return.

## Text over a photo gets its contrast from the image, not the text

**Default it corrects:** hunting for a text colour that reads over every part of a busy photo — white is lost in the highlights, black in the shadows.
**Rule:** tame the image instead, in one of four ways: a translucent overlay (dark under light text, light under dark text); lower the image's own contrast and re-balance its brightness; colourise it (lower contrast, desaturate, then a single-colour fill in `multiply`), which also ties it to the palette; or a soft glow `text-shadow` — large blur, no offset — combined with a smaller contrast reduction.

## Everything is drawn at its intended size

**Default it corrects:** a 24px icon scaled to 96px for a feature grid (chunky, detail-free); a full-app screenshot shrunk until its text is 4px; a 128px logo shrunk to a favicon that turns to mush.
**Rule:** a small icon filling a large slot sits inside a shape with a background, at close to its drawn size. A screenshot is taken at a narrower viewport, cropped to the part that matters, or redrawn as a simplified sketch with lines for text. A favicon is a redrawn, simplified mark at its target size.

## User-supplied images sit in fixed frames

**Default it corrects:** avatars and thumbnails rendered at their intrinsic aspect ratio, so every row is a different height; an uploaded image whose background matches the page and loses its edge.
**Rule:** a fixed-ratio frame with `object-fit: cover`, centred. An edge that may bleed into the page takes a faint inner shadow or a translucent inner ring — a solid border clashes with the image's own colours.

## Overlapping images keep a gap

**Default it corrects:** stacked avatars or overlapping photos whose edges collide.
**Rule:** give each a ring in the page's background colour, so the layers read without clashing.
