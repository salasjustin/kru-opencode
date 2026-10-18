# Directions

Values craft, for drafting canvas directions from nothing.

## Start from a feature, never the shell

**Default it corrects:** the first artboard is a nav bar, a sidebar and an empty content well — decisions about navigation made before any feature exists to navigate.
**Rule:** draw the inventory's most central feature first (a flight search is two city fields, two dates and a button); the shell comes after a few features show what it has to hold. This is the same order as primitives before shells in `design-system`.

## Hierarchy first, detail after

**Default it corrects:** a first direction polished in faces, shadows and icons while its layout is still unsettled.
**Rule:** settle each direction's layout and hierarchy in grayscale, then spend colour, depth and finish on top. A direction that only works in colour fails `hierarchy.md` → *Hierarchy survives grayscale*.

## Draw only what the slice will build

**Default it corrects:** an attachments area on the comment box, a filter bar on the list, "coming soon" affordances — each drawn because it will exist one day, and each one a builder now has to build or ship half-done.
**Rule:** an artboard draws the smallest useful version of the feature. A nice-to-have is noted beside the working files, never drawn.

## A direction is a personality, held consistently

**Default it corrects:** 2–4 directions that differ only in accent hue, or one direction mixing sharp and rounded corners.
**Rule:** a personality is carried by concrete levers moved together: the face (a serif reads classic or elegant, a rounded sans playful, a neutral sans lets other levers speak), the colour (blue safe, gold expensive, pink light-hearted), the radius (none formal, small neutral, large playful), and the voice of the copy (whose words are `ux-copy`'s). Every direction commits each lever one way and holds it on every artboard. The audience's own familiar sites are a fair guide to the register; a direct competitor's look is not.
**Check:** the directions differ on at least two levers each, and no artboard mixes radii families.

## Ornament that reads as generated

**Default it corrects:** a first direction dressed in what generators reach for — a pill badge or small label above the headline, a row of icon-topped feature cards, a gradient background or button, a soft shadow under every resting card, tiny letter-spaced uppercase labels.
**Rule:** draw none of them. Each is a reflex the direction didn't choose, and a panel scoring 247 gallery sites found every one at least twice as often on the weak sites as on the strong (taste-skill v2's study: icon feature cards 28% against 1%, gradients 52% against 22%, resting shadows 48% against 24%, tracked caps 57% against 16%, pill badges 34% against 14%). Put a label's information in the heading or its first sentence; separate surfaces by a tone step; keep shadows for what floats, a menu or a dialog. The space a cut ornament leaves goes to scale (the main thing larger), the full content, or a picture made for this subject — never to the next ornament.
**Check:** no artboard carries one of the five unless the user's brief or brand asked for it by name.

## Finish

For a direction that is correct but plain. Each lever is optional; pick one or two, never all.

- **Supercharge a default** — bullets become icons (a check, an arrow, or one specific to the content), a testimonial's quote mark is promoted into a large coloured element, a link gets a custom thick or offset underline, checkboxes and radios take the brand colour when selected.
- **An accent border** — a colour strip across a card's top, beside an alert, under an active nav item or a headline, or across the top of the whole layout.
- **A decorated background** — a panel or section in a different flat colour; a low-contrast repeating pattern, full-bleed or along one edge; a single shape or illustration placed deliberately. Whatever sits behind text stays low-contrast.
- **Rethink a component's form** — a dropdown with sections, columns, icons and supporting text; a table whose non-sortable columns merge into one cell with its own hierarchy, images and colour; a critical radio set drawn as selectable cards.
