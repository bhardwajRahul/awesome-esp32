# Contributing

Suggestions welcome. The bar is "worth building, copying, or watching run", not "uses an ESP32".

## Before you open a pull request

Two rules reject more pull requests than everything else here combined. Read them first.

**1. The project must have run on real hardware, and you must link the proof.**

Counts: a photo of the thing built and powered, a video of it running, a live demo anyone can open.

Does not count: a 3D render, a PCB viewer, a generated snapshot, a simulator screenshot, a render of an enclosure. A thing that only exists as an image has not run.

**2. A new category needs at least two projects.**

Add your project to a category that already exists in the README. If nothing fits, say so in the pull request and propose the category, then expect it to wait until a second project of its kind shows up. A category with one entry says nothing.

The rest of this document is the detail.

## What gets in

Three gates. A project needs all three, and one missing gate is a no whatever the other two look like.

1. **Public source you can build.** A repository, not a video-only showcase. If the code is not there, it is not an entry.
2. **Evidence it ran on real hardware.** Rule 1 above: a photo, a video, or a live demo, linked in the pull request.
3. **Someone else could reproduce it.** The README names the board and says how to flash it.

Then:

- **Stars are not a criterion.** A 0-star project can be more interesting than a 2k-star one, and often is. Do not argue for an entry with its star count, and do not argue against one either.
- **Self-promotion is welcome and must be disclosed.** Submitting your own project is fine, say it is yours in the pull request. The same three gates apply.
- **An entry belongs to one purpose category.** Hardware never justifies a new category, it goes in the tags.

## Adding a project

- One project per pull request, with a short PR title like `Add project-name`.
- Add it to the bottom of the category that fits best, per rule 2 above.
- Format: `- [name](link-to-repo) - What it is, one sentence ending with a period.`
- The link must point to a **source repository** (or the closest thing to one). Product pages, videos, and blog posts can complement it as a trailing `([demo](url))`, never replace it.
- Descriptions state what the project does, not that it is "awesome", "simple", or "blazing fast".
- The project should be alive: builds against a current toolchain, or is finished and still works.

## Categories and tags

The Applications tree answers one question, what a project is for. Hardware facts answer a different one and live in tags, so a board never creates a category.

Tags are a closed set, written at the end of the entry line as backticked tokens, hardware first and `ecosystem` last:

| Tag | Means |
|---|---|
| `e-ink` | Drives an e-ink or e-paper panel. |
| `s3-amoled` | Runs on an ESP32-S3 touch AMOLED handheld (usually the Waveshare 1.8). |
| `led-matrix` | Output is an addressable LED matrix, not a framebuffer panel. |
| `p4` | ESP32-P4. |
| `c3` | ESP32-C3. |
| `headless` | No local display: the interface is audio, a network, or a browser. |
| `battery` | Designed to run on battery, with the power work that implies. |
| `ecosystem` | A platform with a plugin or community scene around it, not a self-contained app. |

Tag only what the project's own README or demo states. Do not infer a chip or a battery from a photo. An untagged entry is the ordinary case, not an oversight. Do not invent new tags in a PR: propose them in an issue, and expect the bar to be at least three entries that would carry the tag.

## Removing or moving a project

Dead links, abandoned repos, and better-fitting categories are all fair PRs. Categories themselves are provisional; restructuring proposals are welcome once a section grows past a dozen entries.
