# Embedding — a widget dropped into a page you don't control

The element is the same; the constraints around it are not. Everything here follows from one fact: **your code runs in someone else's document, on their origin, under their CSP, beside their CSS.**

## Registration and the bundle
- **Guard the definition.** Two teams embed your script, or one embeds it twice — `customElements.define` throws on a duplicate name and kills the rest of your bundle with it. `if (!customElements.get('donate-form')) customElements.define(…)`, and treat the tag name as owned forever: it is a global on every page you land on, so namespace it (`org-donate-form`). **Scoped custom element registries are Limited availability**, so there is no platform escape from this yet — two versions of your widget on one page cannot both define the tag, and the second one loses.
- **One file, no bare specifiers, no globals.** The host has no bundler and no import map. Ship a single self-contained ES module from a versioned, immutable URL; write nothing to `window`.
- **Pin the version in the URL.** A floating `/latest` means your next deploy edits every embedder's page without their knowledge — the failure surfaces on their site, in their name.
- **`customElements.whenDefined()`** is how an embedder waits for you; document it instead of asking them to guess with a timeout.

## The host's CSP is yours to live under, not to change
You cannot relax it, and a `Content-Security-Policy` violation is a silent no-op in the console of a site you can't see.
- No `eval`, no `new Function`, no injected inline `<script>`.
- **Prefer `adoptedStyleSheets` over an inline `<style>` in the shadow root.** A strict `style-src` blocks an inline `<style>` element, and blocks `setAttribute("style", …)` and `el.style.cssText = …` with it. Constructed stylesheets and `insertRule()` are *specified* to need `'unsafe-eval'`, but per MDN **no browser currently blocks them** — so this works today as a matter of implemented behavior rather than by design. Setting a property directly (`el.style.display = "none"`) is never blocked.
- **Document the directives an embedder must allow** — your script origin, your API origin, and every third party you load (Stripe's `js.stripe.com` and its frame ancestors). That list is part of your integration docs, not an afterthought.

## Your public API is three surfaces, and all three are versioned
Once a site embeds you, none of these can be renamed without breaking them:
1. **The tag name and its attributes** — the markup an embedder pastes.
2. **The events you emit** and the shape of their `detail`.
3. **The theming contract**: the `part="…"` names you expose and the documented `--prefix-*` custom properties you read.

Treat additions as a minor version and any rename as a breaking one. Publish the theming set explicitly — an embedder styling a `::part` you never documented is a dependency you didn't agree to and will break by accident.

## Surviving the host's CSS
The inheritance channel `SKILL.md` describes as your theming API is, in someone else's page, also their leak into you.
- Set every inherited property you care about explicitly on `:host` — `font-family`, `font-size`, `line-height`, `color`, `letter-spacing`, `text-transform` — rather than inheriting a stranger's body type.
- **Their `--primary` is not your `--primary`.** Off the host's own site the prefix rule is hygiene; here it is the only thing between their brand color and your component.
- **`position: fixed` is not reliable in someone else's page.** Any ancestor with a `transform`, `filter`, `perspective`, `backdrop-filter`, `contain`, or `will-change` becomes the containing block, and your "fixed" overlay is pinned inside their card instead of the viewport. Use the **top layer** — `<dialog>.showModal()` or a `popover` — which escapes transformed ancestors by construction.
- **A layout shift you cause lands in their Core Web Vitals report, not yours.** Reserve your dimensions on `:not(:defined)`.

## Storage, identity, and the redirect
- **You are on the host's origin.** `localStorage`/`sessionStorage` you write is *theirs*, shared with every other script on that page, and gone when they clear it. Don't put anything sensitive there.
- **Cookies to your own API are third-party cookies** and are blocked by default in current browsers. Carry state in the request (a short-lived token minted server-side) rather than assuming a session cookie survives.
- **A payment redirect returns to the host page, not to yours.** `return_url` is the embedder's URL, which means it's configuration you accept per embedder and validate, not a constant you hardcode. Getting it wrong strands the donor on a page that isn't theirs, and only on the cards that trigger a challenge — so it passes every happy-path test.

## Where the payment layer meets the shell
`stripe-specialist` owns the client, the PaymentIntent, the webhook and the entitlement. This seat owns the element and the mount node handed to it. Three things fall between them and belong in the handoff:

- **Mounting Elements inside a shadow root is unverified territory — spike it before the architecture depends on it.** Stripe's `element.mount()` reference documents a string selector or a DOM element and says *"Stripe inserts an iframe into each `div` to securely collect payment information"*; it says nothing about shadow roots either way. The known report is `stripe/stripe-js` issue #143 (opened 2021-01-30, since closed with no documented resolution): mounting into a shadow root succeeded, then `confirmCardPayment` threw as though the element were unmounted — the reporter's theory being that Stripe's internal selectors don't traverse shadow boundaries. That is one five-year-old data point, not a current verdict. **Build the smallest possible spike — mount, then confirm — before committing**, and if it fails, mounting the payment field in light DOM beside the shadow root is the fallback that keeps the rest of the encapsulation.
- **Your CSS cannot reach inside Stripe's iframe.** Its `appearance` object is the only styling channel, so the design tokens have to be **serialized into it** — one function mapping the token file to `appearance.variables`/`rules`. Name the owner of that function explicitly; unowned, the payment field is the one control on the form that doesn't match the design.
- **PCI scope is why the iframe exists.** Whatever the shadow-root answer turns out to be, the card field stays Stripe's iframe — don't "solve" a styling problem by collecting card data in your own inputs.

## Accessibility in a document you don't own
- **Don't emit a heading level.** You have no idea where you sit in their outline. Take the level as an attribute with a sane default, or use text that isn't a heading at all.
- **Point every ARIA reference at your own markup.** An ID in the host's document is not yours: it collides with theirs, and it changes on their next deploy without telling you.
- Your focus styles must survive their reset. Author the focus indicator on `:host` and inside the root; don't rely on the UA default reaching you.
