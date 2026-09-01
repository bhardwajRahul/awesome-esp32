# AGENTS.md

## What this is

`awesome-esp32` is a curated public list of ESP32 projects (the ESP32 family first, close cousins like the RP2350 when a project ports across chips), in the awesome-list tradition: a single `README.md`, entries of the form `- [name](repo) - description. ([demo](url))`. It is a taste-driven project list, not a library index (that niche is taken by agucova/awesome-esp).

## How to run

The deliverable is `README.md`, and it is the only thing to run: read it. The repo is markdown and nothing else, no build, no CI, no scripts.

## Conventions

- Inclusion bar: the three gates in `CONTRIBUTING.md`, all required (public source you can build, evidence it ran on real hardware, reproducible by a stranger). Stars are explicitly not a criterion. `CONTRIBUTING.md` opens with a **Before you open a pull request** block that states the two blocking rules (linked hardware proof, no category for a single project) ahead of everything else, and `.github/pull_request_template.md` asks for the same two things at the moment someone writes the PR. Reword one and reword the other.
- Every entry links to a source repository. **Verify the URL resolves** (`git ls-remote <url> HEAD`) before committing an entry.
- Demo links (tweet, video) ride along as a trailing `([demo](url))`; they never replace the repo link.
- Descriptions: one sentence, factual, no superlatives.
- Two fixed top-level sections: **Applications** (things people built and run on an ESP32) and **Tools, utilities & libraries**. An entry's home is decided by what it IS, not what it enables: firmware you flash and use is an application, a framework/SDK/flasher is a tool.
- Scope is the CHIP, not a vendor: any device built around an ESP32 (dev kit, Waveshare, M5Stack, LilyGO, Seeed, Adafruit, commercial products) is in scope on equal terms. The README says so explicitly (decided 2026-08-31); do not let the `s3-amoled` board read as the list's subject.
- Structure encodes PURPOSE only, no exception: the Applications tree answers "what is it for". There is no `E-paper` category any more (and the word we use is e-ink).
- Hardware answers a different question, and since 2026-09-01 it is answered by NAME, not by tag: every entry writes the device it runs on, spelled exactly as `devices.md` spells it, so Ctrl-F on that name is the reverse index (own a Cardputer, find your projects). No generated backlinks, no CI, no per-device project lists: the spelling IS the index, which is why a sloppy alias silently breaks it. Relative references ("the same AMOLED device", "both of its boards") are the specific thing this replaced. A device earns a section in `devices.md` on first use, unlike a tag which needs three entries.
- Tags: a closed vocabulary of trailing backtick tokens, hardware first then `` `ecosystem` `` last: `` `e-ink` ``, `` `s3-amoled` ``, `` `led-matrix` ``, `` `p4` ``, `` `c3` ``, `` `headless` ``, `` `battery` ``, `` `ecosystem` ``. The table in `CONTRIBUTING.md` defines each. Tag ONLY what the project's own README or demo states; never infer a chip or a battery from a photo. A new tag type needs ≥3 entries that would carry it AND a reader question the prose can't answer; adding one is a deliberate decision, not per-entry improvisation. No badges, no `<kbd>`, no legends.
- A new subcategory needs 2 entries, the same floor `CONTRIBUTING.md` gives contributors. One number, stated publicly: holding a stricter private bar would reject people who did exactly what we told them to do. A single entry never gets its own category, it waits for a second of its kind.
- Subcategories are provisional by design. When a category passes ~12 entries or the overall list doubles, restructure freely; do not preserve the current taxonomy out of caution.
- New entries go at the bottom of their category.
- README style: no badges, no ASCII art, no screenshots grid.

## Sourcing

The primary intake is Sylve pasting links (t.co, github, or tweet URLs) in session; the global `/awesome-esp32-add` skill codifies the procedure (resolve, verify, one-sentence description, classify, demo link, push). An X-bookmarks scraper once lived in `harvest/` (patchright, dedicated Chrome profile); it was removed to keep the repo pure markdown, recover it from git history if ever wanted, and do NOT relaunch it unless Sylve asks.

A link checker lived in `scripts/check-links.ts` with a Monday GitHub Action until 2026-09-01. Same reasoning, same outcome: it was maintenance tooling for Sylve, not something a contributor needs, so it left the public repo. It now lives at `~/tools/awesome-esp32-linkcheck/check-links.ts` and takes the README path as an argument. Do not add it back.

## Gotchas

- The list is public and pushed straight to `main` (no PRs for our own edits; external contributions arrive as PRs per `CONTRIBUTING.md`).
- License is CC0; keep descriptions original rather than pasted from project READMEs.
