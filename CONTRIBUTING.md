# Contributing

Suggestions welcome. The bar is "worth building, copying, or watching run", not "uses an ESP32".

## What gets in

Three gates. A project needs all three, and one missing gate is a no whatever the other two look like.

1. **Public source you can build.** A repository, not a video-only showcase. If the code is not there, it is not an entry.
2. **Evidence it ran on real hardware.** A video, photos, or a live demo. Renders and mockups do not count; a thing that only exists as an image has not run.
3. **Someone else could reproduce it.** The README names the board and says how to flash it.

Then:

- **Stars are not a criterion.** A 0-star project can be more interesting than a 2k-star one, and often is. Do not argue for an entry with its star count, and do not argue against one either.
- **No new category for a single entry.** If a project fits nowhere, it waits for a second one of its kind. A category with one entry says nothing.
- **Self-promotion is welcome and must be disclosed.** Submitting your own project is fine, say it is yours in the PR. The same three gates apply.
- **An entry belongs to one purpose category.** Hardware never justifies a new category, it goes in the tags.

## Adding a project

- One project per pull request, with a short PR title like `Add project-name`.
- Add it to the bottom of the category that fits best. If none fits, say so in the PR and propose one (see the single-entry rule above).
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
