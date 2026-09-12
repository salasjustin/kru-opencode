---
name: kru-local-browser
description: Drive the running local dev app in a real browser at localhost — QA a change, reproduce a UI bug, measure rendered DOM and computed styles. Use whenever the target URL is localhost.
allowed-tools: chrome-devtools_new_page, chrome-devtools_navigate_page, chrome-devtools_list_pages, chrome-devtools_select_page, chrome-devtools_close_page, chrome-devtools_take_snapshot, chrome-devtools_take_screenshot, chrome-devtools_emulate, chrome-devtools_resize_page, chrome-devtools_click, chrome-devtools_hover, chrome-devtools_fill, chrome-devtools_fill_form, chrome-devtools_press_key, chrome-devtools_wait_for, chrome-devtools_evaluate_script, chrome-devtools_list_console_messages, chrome-devtools_list_network_requests, read
---

<!-- vendored (locally authored — no upstream) → `skills/local-browser`. Thin project wrapper over the `chrome-devtools` MCP server (ChromeDevTools/chrome-devtools-mcp), backing the `/kru/visual-review` and `/kru/accessibility-review` passes. Every fact below was verified against chrome-devtools-mcp@1.7.0 on 2026-08-24 by driving the server directly — re-verify the clamp and the whole-state behaviour after a server upgrade rather than trusting this file. No upstream skill exists → no re-sync source; maintain it here. -->

# local-browser

The tool schemas are in your context — this file carries only what they do not say.

The server runs **headless** on a persistent profile at `~/.cache/chrome-devtools-mcp/chrome-profile`, so nothing appears on the user's screen and logins survive across runs. One browser serves the whole session: every seat driving it shares the same pages.

## 1. The dev server is the user's

Ask the user to start it, and wait for their confirmation before opening anything. If nothing responds at the target URL, stop and ask — a failed load is theirs to fix, not yours to route around.

One 500 is not the app's: a workspace package's new `exports` entry doesn't reach a running Vite dev server — Node caches the `package.json` it already resolved, so every import of the new subpath fails with *is not exported under the conditions […]* while `tsc` and vitest both pass. Read it as a restart, never as a bad `exports` entry, and ask for the restart in the same slice.

## 2. Work from snapshots, not screenshots

`take_snapshot` returns the a11y tree with a `uid` per element, and every interaction tool takes that `uid`. Screenshots are for the human reading the report: capture with `filePath` and `read` the file when a defect needs to be *seen*.

## 3. Set a breakpoint with `emulate`, and carry every override on every call

`emulate` takes the viewport as a string — `"375x812x3,mobile,touch"` — and renders a true 375px CSS viewport. Two verified behaviours decide whether a sweep is measuring what it thinks:

- **`resize_page` clamps at ~500px.** It sizes the window, and Chrome's minimum window width floors it — headless included. `resize_page` to 375 leaves `innerWidth` at 500 and reports success. Widths below ~500 belong to `emulate`.
- **`emulate` sets whole state, not a patch.** Each call replaces the emulation config, so an `emulate` carrying only `colorScheme: "dark"` silently drops a viewport set earlier and the page snaps back to 500px. Send every override you still want in the same call: `{viewport: "375x812x3,mobile,touch", colorScheme: "dark"}`.

The viewport override **survives navigation** — set it once per breakpoint and drive the whole route list under it. **`mobile,touch` recreates the document**: an open fold, a typed value, a `window.*` marker set before the call is gone after it. Set the breakpoint, then drive the state.

## 4. On an auth redirect, hand back

Headless means there is no window for the user to log into. The profile is the seam: it persists, so one interactive login serves every later run. Give them the command, wait for confirmation, then re-navigate.

```bash
# user runs this, logs in, quits Chrome — the headless server picks up the cookies
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/.cache/chrome-devtools-mcp/chrome-profile"
```

Chrome locks that directory, so their window and the server's browser take turns — confirm they have quit before driving again. The lock cuts the other way too, and silently: while the headless server is running there **is** a Chrome process, so macOS treats Chrome as already running — the dock icon, `open <url>` and the command above all activate the invisible instance and no window appears. Kill it by its profile path first (`pkill -f chrome-devtools-mcp/chrome-profile`, `-9` if it lingers), then `open -a "Google Chrome"`. A visible Chrome opened *before* the server spawns makes the next headless launch harmless. For a deliberately **logged-out** state, `new_page` with `isolatedContext` gives a clean cookie jar without touching the profile.

## 5. Measure with `evaluate_script`

It takes a function declaration — `() => getComputedStyle(document.querySelector('.x')).outlineWidth` — evaluated fresh each call, so there is no cross-call redeclaration to work around. Ask one question per call and put the value inline next to the finding. `filePath` diverts a large result to a file instead of your context.

`list_console_messages` and `list_network_requests` cover the errors a rendered page hides: a failed fetch, a hydration warning, a 404 on an asset that leaves a gap rather than an error.

## 6. A React-controlled input doesn't see `.value`

Setting `.value` — `fill` with `""` included — fires no React `input` event, so a change-tracking hook never arms and the save press stays disabled. Go through the prototype setter and dispatch; to clear a field, set a different value first, since React skips a dispatch whose value matches its tracker:

```js
() => {
  const el = document.querySelector('#host');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, 'x'); el.dispatchEvent(new Event('input', { bubbles: true }));
  set.call(el, '');  el.dispatchEvent(new Event('input', { bubbles: true }));
}
```

## 7. A `click` scrolls before it presses

CDP scrolls the target into view before the press, so a scroll-position read across `click` measures the tool, not the app — it reads as the page resetting scroll. Dispatch the press from the page and read around it:

```js
() => { const before = scrollY; document.querySelector('#save').click(); return { before, after: scrollY }; }
```

## Done when

Every claim about the app is backed by an observed snapshot, screenshot, or `evaluate_script` result — never inferred from source — and `close_page` has run on the pages you opened.
