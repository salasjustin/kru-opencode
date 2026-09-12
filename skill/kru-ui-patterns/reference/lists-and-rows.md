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
