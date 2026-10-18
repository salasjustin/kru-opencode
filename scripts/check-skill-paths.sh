#!/bin/bash
# Every backticked repo path token must exist; glued prose in path backticks must fail.
set -euo pipefail
cd "$(dirname "$0")/.." || exit 2
root=$PWD

exec python3 - "$root" << 'PY'
import os
import re
import shlex
import sys
from pathlib import Path

root = Path(sys.argv[1])
skills_root = root / "skills"
known_tops = {p.name for p in skills_root.iterdir() if p.is_dir()} if skills_root.is_dir() else set()

LOCAL = re.compile(
    r"(?<!(?:\.claude/))(?<![\w./])"
    r"(skills/[a-z0-9][a-z0-9-]*(?:/[A-Za-z0-9_.-]+)*)"
)

PREFIX_STARTS = (
    "{KRU_HOME}/kru/",
    "skills/",
    "references/",
    "scripts/",
    "agents/",
    "hooks/",
)

PATH_MARKERS = (
    "{KRU_HOME}/kru/",
    "skills/",
    "references/",
    "scripts/",
    "agents/",
    "hooks/",
)

BACKTICK = re.compile(r"`([^`\n]+)`")
PLACEHOLDER_ANGLE = re.compile(r"<[^>]+>")
# `{foo}` placeholders only — not `{KRU_HOME}/kru` env paths.
PLACEHOLDER_BRACE = re.compile(r"(?<!\$)\{[^}]+\}")
HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)

SCAN_ROOTS = [
    root / "skills",
    root / "references",
    root / "hooks",
    root / "scripts",
]
SCAN_FILES = [
    root / "ROSTER.md",
    root / "README.md",
    root / "SOURCES.md",
    root / "TRACKER.md",
    root / "PREFERENCES.md",
]

SKIP_FILES = {root / "scripts" / "check-skill-paths.sh"}


def iter_files():
    extra = os.environ.get("CHECK_SKILL_PATHS_EXTRA", "")
    for p in extra.split(":"):
        if p:
            fp = Path(p)
            if fp.is_file():
                yield fp
    for base in SCAN_ROOTS:
        if not base.is_dir():
            continue
        for p in base.rglob("*"):
            if p.suffix in {".md", ".sh"} and p.is_file():
                if p in SKIP_FILES:
                    continue
                if "check-skill-paths" in p.name and p.name.endswith(".test.sh"):
                    continue
                yield p
    for p in SCAN_FILES:
        if p.is_file():
            yield p


def clean(path: str) -> str:
    return path.rstrip(".,;:)`\"'")


def rel_path(f: Path) -> str:
    try:
        return str(f.relative_to(root))
    except ValueError:
        return str(f)


def is_external_or_non_repo(token: str) -> bool:
    if token.startswith(("~", "http://", "https://", "raw.", "main:")) or token.startswith("@"):
        return True
    if "githubusercontent.com" in token or "github.com/" in token:
        return True
    if re.match(r"^/agents/", token):
        return True
    if re.match(r"^agents/[^/]+$", token) and not (root / token).exists():
        return True
    if token.startswith((".claude/", ".agents/")):
        return not (root / token).exists()
    if token.startswith(("pstack/", "vercel:")):
        return True
    if "references/{" in token:
        return True
    return False


def is_path_like_token(token: str) -> bool:
    if is_external_or_non_repo(token):
        return False
    if "/" not in token:
        return False
    if any(token.startswith(p) for p in PREFIX_STARTS):
        return True
    if "{KRU_HOME}/kru/" in token:
        return True
    if re.search(r"(?:^|/)(?:skills|references|scripts|agents|hooks)/", token):
        return True
    return bool(re.match(r"^skills[^/]", token))


def is_shell_command_line(token: str) -> bool:
    first = token.strip().split(None, 1)[0] if token.strip() else ""
    return first in {"bash", "sh", "env", "sudo"} or (
        "/" in first
        and first.endswith((".sh", ".mjs", ".ts", ".js"))
    )


def path_words_from_token(token: str) -> list[str]:
    if is_shell_command_line(token):
        try:
            parts = shlex.split(token)
        except ValueError:
            parts = token.split()
        words = []
        for w in parts[1:]:
            ew = expand_plugin_root(w)
            if "/" in ew and (
                ew.startswith(str(root))
                or any(ew.startswith(p) for p in PREFIX_STARTS if p != "{KRU_HOME}/kru/")
                or "{KRU_HOME}/kru/" in w
            ):
                words.append(w)
        return words
    if " " in token:
        return []
    return [token]


def strip_placeholders(segment: str) -> str:
    segment = PLACEHOLDER_ANGLE.sub("", segment)
    return PLACEHOLDER_BRACE.sub("", segment)


def expand_plugin_root(path_word: str) -> str:
    return path_word.replace("{KRU_HOME}/kru", str(root))


def resolve_repo_path(path_word: str, source: Path) -> Path | None:
    w = strip_placeholders(expand_plugin_root(path_word.strip())).split("#", 1)[0]
    if not w or "..." in w or "*" in w:
        return None
    if w.startswith(f"{root}/") or w == str(root):
        return Path(w)
    if w.startswith(("skills/", "references/", "scripts/", "agents/", "hooks/")):
        candidates = [root / w]
        p = source.parent
        for _ in range(8):
            candidates.append(p / w)
            if p == root:
                break
            p = p.parent
        for c in candidates:
            if c.exists():
                return c
        return candidates[0]
    if w.startswith("./"):
        return source.parent / w[2:]
    if w.startswith(".claude/"):
        return root / w
    return None


def path_exists(path_word: str, source: Path) -> bool:
    if is_external_or_non_repo(path_word):
        return True
    if "*" in path_word or "<" in path_word or "{" in path_word:
        return True
    full = resolve_repo_path(path_word, source)
    if full is None:
        return False
    return full.exists()


fail = 0
seen = set()

for f in iter_files():
    try:
        text = f.read_text(encoding="utf-8")
    except OSError:
        continue
    rel = rel_path(f)
    text = HTML_COMMENT.sub("", text)

    for m in BACKTICK.finditer(text):
        token = m.group(1)
        if not is_path_like_token(token):
            continue

        if " " in token:
            if is_shell_command_line(token):
                for pw in path_words_from_token(token):
                    if not path_exists(pw, f):
                        print(f"missing path `{pw}` in `{token}` (from {rel})")
                        fail = 1
            else:
                print(f"garbled path token `{token}` (from {rel})")
                fail = 1
            continue

        if not path_exists(token, f):
            print(f"missing path `{token}` (from {rel})")
            fail = 1

    for m in LOCAL.finditer(text):
        path = clean(m.group(1))
        if path.endswith("...") or "/..." in path:
            continue
        if "main/skills" in path or "/blob/" in path:
            continue
        top = path.split("/", 2)[1] if path.startswith("skills/") else ""
        if top not in known_tops:
            continue
        key = (path, rel)
        if key in seen:
            continue
        seen.add(key)
        full = root / path
        if not full.exists():
            print(f"missing path {path} (from {rel})")
            fail = 1

sys.exit(fail)
PY
