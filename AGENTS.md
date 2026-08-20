# AGENTS.md

## What this is

`awesome-esp32` is a curated public list of ESP32 projects (the ESP32 family first, close cousins like the RP2350 when a project ports across chips), in the awesome-list tradition: a single `README.md`, entries of the form `- [name](repo) - description. ([demo](url))`. It is a taste-driven project list, not a library index (that niche is taken by agucova/awesome-esp).

## How to run

The deliverable is `README.md`. `bun scripts/check-links.ts` verifies every link (a GitHub Action runs it Mondays and files a `linkcheck` issue on failures; export `GITHUB_TOKEN` locally to avoid API rate-limit noise).

## Conventions

- Inclusion bar: the three gates in `CONTRIBUTING.md`, all required (public source you can build, evidence it ran on real hardware, reproducible by a stranger). Stars are explicitly not a criterion.
- Every entry links to a source repository. **Verify the URL resolves** (`git ls-remote <url> HEAD`) before committing an entry.
- Demo links (tweet, video) ride along as a trailing `([demo](url))`; they never replace the repo link.
- Descriptions: one sentence, factual, no superlatives.
- Two fixed top-level sections: **Applications** (things people built and run on an ESP32) and **Tools, utilities & libraries**. An entry's home is decided by what it IS, not what it enables: firmware you flash and use is an application, a framework/SDK/flasher is a tool.
- Structure encodes PURPOSE only, no exception: the Applications tree answers "what is it for". Hardware answers a different question and lives in tags. There is no `E-paper` category any more (and the word we use is e-ink).
- Tags: a closed vocabulary of trailing backtick tokens, hardware first then `` `ecosystem` `` last: `` `e-ink` ``, `` `s3-amoled` ``, `` `led-matrix` ``, `` `p4` ``, `` `c3` ``, `` `headless` ``, `` `battery` ``, `` `ecosystem` ``. The table in `CONTRIBUTING.md` defines each. Tag ONLY what the project's own README or demo states; never infer a chip or a battery from a photo. A new tag type needs ≥3 entries that would carry it AND a reader question the prose can't answer; adding one is a deliberate decision, not per-entry improvisation. No badges, no `<kbd>`, no legends.
- A new subcategory needs ≥3 entries; a single entry never gets its own category, it waits for a second of its kind.
- Subcategories are provisional by design. When a category passes ~12 entries or the overall list doubles, restructure freely; do not preserve the current taxonomy out of caution.
- New entries go at the bottom of their category.
- README style: no badges, no ASCII art, no screenshots grid.

## Sourcing

The primary intake is Sylve pasting links (t.co, github, or tweet URLs) in session; the global `/awesome-esp32-add` skill codifies the procedure (resolve, verify, one-sentence description, classify, demo link, push). An X-bookmarks scraper once lived in `harvest/` (patchright, dedicated Chrome profile); it was removed to keep the repo pure markdown, recover it from git history if ever wanted, and do NOT relaunch it unless Sylve asks.

## Gotchas

- The list is public and pushed straight to `main` (no PRs for our own edits; external contributions arrive as PRs per `CONTRIBUTING.md`).
- License is CC0; keep descriptions original rather than pasted from project READMEs.
