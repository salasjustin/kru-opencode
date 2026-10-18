# Lists and rows

## A repeated control names its own row to assistive tech, not on screen

**Trigger:** an action that appears on every row — Remove beside each field group, edit on each card, a per-row menu.
**Pattern:** keep the visible word constant; give each instance its own accessible name from the row it acts on.
**Default it corrects:** either twelve buttons all announcing "Remove", or a visible label padded out per row ("Remove line 3") that makes the column noisy to read.
**Why:** a screen-reader user hits the button out of context and needs to know which row it drops; a sighted user reads it inside the row and needs no repetition of what the row already says.
**Shape:**
```html
<button aria-label="Remove {row.name}">Remove</button>
```
**Applies when:** any repeated control. Where the row's name is itself rendered adjacent, `aria-labelledby` pointing at both nodes beats duplicating the string.

## A "this is yours" marker resolves by id, server-side

**Trigger:** a row, comment or record rendering differently for the viewer who owns it — a *you* badge, an edit affordance, a highlighted row.
**Pattern:** compare ids on the server and send the boolean down with the row.
**Default it corrects:** comparing the display name snapshotted onto the record at write time against the current viewer's name, in the client.
**Why:** display names collide and they change. Two users sharing one name each see the other's rows as their own, and a rename silently un-owns everything that person wrote before it. The failure is toward silence — nothing throws, the marker simply sits on the wrong row — so it survives every test that lacks two same-named users.
**Applies when:** any per-viewer treatment. A name rendered purely as attribution needs no comparison at all.


## A table wider than the viewport scrolls inside its own frame

**Trigger:** a data table on a phone-width viewport.
**Pattern:** wrap the table in one `overflow-x: auto` frame; one rendering at every width.
**Default it corrects:** a breakpoint that swaps in a second, stacked (card) rendering of the same rows — or a table squeezed to fit because something collapsed its natural minimum.
**Why:** two renderings are two DOMs to keep true, doubling the markup, the a11y surface and every later edit; a scroller keeps the columns readable and the DOM singular. And the squeeze is usually self-inflicted — `overflow-wrap: anywhere` on an ancestor drops min-content to one character, so the table *can* shrink and does — check what destroyed the minimum before reaching for a breakpoint.
**Shape:**
```html
<div style="overflow-x: auto"><table>…</table></div>
```
The frame scrolls; the page never does.

## A per-row boundary is a margin that adds to the grid gap

**Trigger:** a grid or flex list where one row needs more separation than the rest — a divider before a total, a break between groups.
**Pattern:** `gap` is uniform by definition, so put the extra on the item as a margin, and write it one step *down* the ladder so `gap + margin` totals the value you meant.
**Default it corrects:** reaching for a per-row `row-gap`, or setting the margin to the full intended value and shipping a boundary one step too wide.
**Why:** the margin stacks on the gap rather than replacing it. The result is off by exactly the gap — small enough to read as intentional in review, large enough to break the rhythm every other row keeps.
**Shape:**
```css
.list { display: grid; gap: var(--space-3); }
.list > .group-end { margin-block-end: var(--space-2); } /* totals --space-4 */
```

## A row's active or open state never changes the label's width

**Trigger:** a nav item, tab, tree row or list row that marks itself current, open or selected.
**Pattern:** carry the state in ink and ground — anything that paints without re-measuring the text. The label's font weight is the same in every state.
**Default it corrects:** `font-weight: 600` on `.active` / `[aria-current]` / `[aria-expanded="true"]`.
**Why:** bold glyphs are wider, so the label re-lays-out as it's pressed — the name shifts under the pointer, a wrapped label changes its line count, and a row of tabs reflows its neighbours. What the ink and ground look like is the token file's; that the state leaves the text's box alone is this entry.
**Applies when:** the state toggles in place. A heading that is always bold never toggles.

## In a clickable row, the name opens the item and the rest of the row does the row's action

**Trigger:** a row with its own action — expand, select, toggle — that also names an entity with a detail screen.
**Pattern:** the name is a real link to the detail; the rest of the row runs the row action. Two targets, one each.
**Default it corrects:** the whole row as one link to the detail, so the row can't also expand — or the whole row expanding, so the only way to the detail is a separate "View" press.
**Why:** a row that does one thing forces the second into an extra control on every row. The name is where the eye already goes for "open this", and a link there keeps middle-click, copy-link and the screen reader's links list.
**Shape:**
```html
<tr aria-expanded="false" onclick="toggle(event)"><td><a href="/people/42">Ana Ruiz</a> (+3)</td>…</tr>
```
The row handler returns early when the event came from the link.

## A card that opens one place is a link on its title, stretched over the card

**Trigger:** a card or tile whose whole surface should open its item, with no row action of its own (a card that has one takes the clickable-row entry above).
**Pattern:** the title is the `<a>`; its `::after` covers the card. Any other control in the card sits above that layer.
**Default it corrects:** the whole card wrapped in `<a>`, so the screen reader reads every word as one link name and a button inside it is an interactive nested in an interactive — invalid, and its press also follows the link.
**Why:** the stretched title keeps the link name to the title, keeps text selectable outside it, and lets a nested control work alone.
**Shape:**
```css
.card { position: relative }
.card .title a::after { content: ""; position: absolute; inset: 0 }
.card :is(button, a:not(.title a)) { position: relative; z-index: 1 }
.card:has(.title a:focus-visible) { outline: var(--focus-ring) }
```
The focus ring moves to the card, since the link's own box is just the title.

## A column of figures read down keeps one decimal count

**Trigger:** a table column, ledger or stat list of numbers the reader compares down the column.
**Pattern:** format every row with the same fraction digits (`minimumFractionDigits` = `maximumFractionDigits`), right-aligned with `tabular-nums`.
**Default it corrects:** stripping a trailing zero off one row — `12.5` above `12.25` — from `Number(x.toFixed(2))`, `parseFloat`, or an `Intl.NumberFormat` given only a maximum.
**Why:** the reader compares by aligned digit positions; a row with fewer decimals shifts every digit out of its column and reads as a different magnitude, or as less precise, when it's neither.

## A ledger block is one grid with its rows on subgrid

**Trigger:** a label/value block, ledger, or any set of rows whose columns must line up down the block.
**Pattern:** one grid on the block owns the column tracks; each row is `grid-column: 1 / -1; display: grid; grid-template-columns: subgrid`.
**Default it corrects:** a grid per row with `auto` or `max-content` tracks.
**Why:** a per-row grid sizes its tracks from that row's own contents, so the value column starts wherever each row's longest label ends — aligned in the fixture, out on the first long label.
**Shape:**
```css
.ledger { display: grid; grid-template-columns: max-content 1fr; }
.ledger > .row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; }
```

## Room above a sentence-and-figure row moves the row, never the figure

**Trigger:** a receipt or ledger row — a sentence that can wrap, with a figure beside it — that needs more space from a control above it.
**Pattern:** the figure sits on the baseline of the sentence's last line; added space goes on the row, so the pair moves down together.
**Default it corrects:** a `margin-top` or padding on the figure alone, which opens the requested gap and drops the figure off the sentence's baseline.
**Why:** the figure closes the sentence it sits beside; off the baseline it floats between that line and the next row, and the offset is a magic number correct at one wrap count.
**Shape:**
```css
.row { display: flex; align-items: last baseline; margin-block-start: var(--space); }
```
**Applies when:** the figure answers the sentence, as on a receipt. `modern-css` owns whether `last baseline` needs a fallback on this stack.

## Each fact about an item gets its own place

**Trigger:** a row, card subtitle, header or meta line carrying several facts about one item — location, an ID, a type, a status, a date.
**Pattern:** give each fact a place that says what it is: a column in a table, a label/value pair in a ledger (`<dl>`), a status as its own badge, a secondary fact on its own line. Where the facts truly are one phrase, write the phrase ("Riverside, CA, since 2019"), not a list.
**Default it corrects:** `Riverside, CA · EIN 12-3456789 · Active` — facts strung together with middle dots (or `|`, `•`, `/`) into one line of text.
**Why:** the dot hides what each fact is: the reader has to recognise an EIN by its shape, a status by its word, and the order differs row to row. A dot-joined string can't align down a list, sort, truncate one fact without cutting another, or carry a label for assistive tech, which reads it as one run-on sentence. Each fact in its own place is scannable in a column and readable by name.
**Shape:**
```html
<dl class="ledger"><dt>Location</dt><dd>Riverside, CA</dd><dt>EIN</dt><dd>12-3456789</dd></dl>
<span class="badge">Active</span>
```
**Applies when:** the facts are different kinds. A breadcrumb or a list of like items ("Tags: a, b, c") is a sequence, and its separator carries order or membership.
