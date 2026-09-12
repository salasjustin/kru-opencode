# Security — what a Go server does for itself

No framework sets any of this. A Go-served SPA gets exactly the headers, cookie flags and checks the code writes. Severity labels are the pack's (Bearer SAST-derived); the API shapes are checked with `go doc` on go1.26.1.

## Sessions and cookies
- **Token bytes from `crypto/rand`**, never `math/rand` — `math/rand/v2` is auto-seeded and still not cryptographic. 32 bytes, base64url.
- **Compare tokens in constant time**: `subtle.ConstantTimeCompare` or `hmac.Equal`. `==` on a `string` returns at the first differing byte and leaks the position.
- **The cookie shape:** `HttpOnly: true`, `Secure: true`, `SameSite: http.SameSiteLaxMode` (Strict breaks the top-level navigation into the app from an email link), `Path: "/"`, a short `MaxAge`, and **`Domain` left empty** — an explicit domain widens the cookie to every subdomain. The **`__Host-` prefix** (`__Host-session`) makes the browser enforce `Secure` + empty `Domain` + `Path: "/"`, so the cookie can't be planted from a sibling host; it's the right shape for the session and the CSRF cookie both.
- **Session ids rotate on login and privilege change**, and logout deletes the server-side record, not only the cookie.
- **Passwords:** Argon2id via `golang.org/x/crypto/argon2` — `time=3, memory=64*1024, threads=4, keyLen=32`, 16-byte salt (OWASP). bcrypt is the fallback; any plain hash is a High finding.

## CSRF — the stdlib has it since 1.25
`net/http.CrossOriginProtection` rejects non-safe cross-origin browser requests by `Sec-Fetch-Site`, falling back to `Origin` vs `Host`; `GET`/`HEAD`/`OPTIONS` always pass; a request with neither header (a curl, a same-origin fetch on an old browser) is treated as same-origin.

```go
csrf := http.NewCrossOriginProtection()
csrf.AddTrustedOrigin("https://app.example.com") // exact origin, only if the SPA is served from another origin
mux := http.NewServeMux()
srv := &http.Server{Handler: csrf.Handler(mux)}
```

Wrap the whole mux, not the routes you remember. `AddInsecureBypassPattern` exists for a webhook route that legitimately has no browser origin — name it in the return when you use it. Pre-1.25 modules do the double-submit cookie by hand: the `__Host-` CSRF cookie compared in constant time against the header the client echoes.

**Vite's dev proxy needs `changeOrigin: false` to pass this guard.** `server.proxy` defaults `changeOrigin: true`, rewriting `Host` to the target while forwarding the browser's `Origin` untouched — the `Origin`-vs-`Host` fallback then refuses every dev mutation with a blanket 403 (dev only; verified on vite 8). Fix the proxy entry — relaxing the guard or rewriting `Origin` in the proxy weakens the shipped check instead.

## Headers middleware
One middleware, outermost after recovery, exact values:

```go
h.Set("Content-Security-Policy", "default-src 'self'; script-src 'self'")
h.Set("X-Frame-Options", "DENY")
h.Set("X-Content-Type-Options", "nosniff")
h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
h.Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
```

The CSP is the one that breaks a SPA: Vite's dev server injects inline scripts, so the dev proxy path skips CSP and prod sets it. An inline `<script>` the built `index.html` needs (a theme flip, analytics) is a hashed `'sha256-…'` source, not `'unsafe-inline'`.

## Request-side trust
- **`X-Forwarded-For` is forged by the client.** Rate limits and admin checks keyed on it are bypassable. Trust it only from a known load balancer — strip or overwrite it at the edge and read the last hop the proxy appended.
- **Open redirect.** A `?next=` / `redirect_to` param on login: reject anything that parses with a scheme or host (`u.IsAbs()`, `u.Host != ""`), reject `javascript:`/`data:` (`url.Parse` accepts them), require a leading single `/` (`//evil.com` is protocol-relative). Or allowlist named destinations.
- **Rate limit auth endpoints**, per client: `golang.org/x/time/rate`, a `map[string]*rate.Limiter` behind a mutex with expiry — a single global limiter lets one abuser starve everyone.
- **Disk paths.** `filepath.Join(base, userInput)` does not stop `../`. If any route serves off disk rather than the embed FS, `os.OpenRoot(base)` (1.24+) and open through the `*os.Root`; pre-1.24 needs `filepath.IsLocal` + `filepath.Rel` and a separator-aware prefix check — `filepath.Clean` + `strings.HasPrefix` is the pattern that fails on `base` vs `base2`.

## What the binary exposes
- **`import _ "net/http/pprof"` registers `/debug/pprof` on `http.DefaultServeMux`** — anywhere in the dependency graph, on every server that uses the default mux. Serve pprof on a second mux bound to `127.0.0.1:6060`, or build-tag it out of prod. A custom `http.NewServeMux()` as the app's router is the structural fix.
- **`govulncheck ./...`** is a High checklist item, not a nicety — it reports only vulnerabilities in symbols the binary actually reaches, so its output is short and every line is real. `reference/testing.md` has the install.

## What never reaches a log line
- A user or session struct printed with `%+v` prints the password hash and the token. Log ids, never records; give secret-bearing types a `LogValue()` (`slog.LogValuer`) that redacts.
- User-supplied strings carry control characters (`\n`, `\r`, ANSI) that forge log lines. `slog` with a JSON handler escapes them; a text handler does not — pick the JSON handler in prod.
- Secrets arrive from env or a mounted file, never a flag (visible in `ps`) and never a default in code.
