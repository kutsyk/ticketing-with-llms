#!/usr/bin/env python3
import argparse
import re
from pathlib import Path

# Match:
#   - A markdown heading (## to ######)
#   - Optional label text and/or colon
#   - A backticked relative path like `api/Dockerfile` or `.env.example`
#   - The very next fenced code block ```lang\n ... \n```
HEADER_AND_BLOCK_RE = re.compile(
    r"""
    ^\#{2,6}[ \t]*                              # heading level 2-6
    (?:[^\n`]*?:?[ \t]*)?                       # optional label + colon
    `(?P<relpath>[^`\n]+)`[ \t]*\r?\n           # backticked path
    (?:[ \t]*\r?\n)*                            # optional blank lines
    ^```(?P<lang>[^\n]*)\r?\n                   # opening fence (lang optional)
    (?P<content>.*?)                            # file content (non-greedy)
    ^```\s*$                                    # closing fence
    """,
    re.MULTILINE | re.DOTALL | re.VERBOSE,
)

def iter_blocks(text: str):
    for m in HEADER_AND_BLOCK_RE.finditer(text):
        relpath = m.group("relpath").strip()
        lang = (m.group("lang") or "").strip()
        content = m.group("content")
        yield relpath, lang, content

def main():
    ap = argparse.ArgumentParser(description="Materialize files under 'ticketing-app' from a spec doc.")
    ap.add_argument("input", help="Path to the input .md/.txt file")
    ap.add_argument("--base-dir", default="ticketing-app", help="Output root dir (default: ticketing-app)")
    ap.add_argument("--no-clobber", action="store_true", help="Skip writing if file already exists")
    args = ap.parse_args()

    base = Path(args.base_dir).resolve()
    base.mkdir(parents=True, exist_ok=True)

    text = Path(args.input).read_text(encoding="utf-8", errors="replace")
    matches = list(iter_blocks(text))

    if not matches:
        print("No file blocks found. Make sure headings contain a backticked path followed by a code fence.")
        return

    created = overwritten = skipped = 0
    for rel, lang, content in matches:
        # Normalize and keep within base
        out = (base / rel).resolve()
        try:
            out.relative_to(base)
        except ValueError:
            print(f"⚠️  Skipping path outside base: {rel}")
            skipped += 1
            continue

        out.parent.mkdir(parents=True, exist_ok=True)

        if out.exists() and args.no_clobber:
            print(f"⏭️  Exists, skipped: {out}")
            skipped += 1
            continue

        if out.exists():
            overwritten += 1
        else:
            created += 1

        out.write_text(content, encoding="utf-8")
        print(f"✅ Wrote: {out}")

    print(f"\nDone. Created: {created}, Overwritten: {overwritten}, Skipped: {skipped}. Base: {base}")

if __name__ == "__main__":
    main()
