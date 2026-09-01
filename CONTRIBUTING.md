# Contributing

Suggestions welcome. The bar is "worth building, copying, or watching run", not "uses an ESP32".

## Before you open a pull request

Two rules reject more pull requests than everything else here combined. Read them first.

**1. The project must have run on real hardware, and you must link the proof.**

Counts: a photo of the thing built and powered, a video of it running, a live demo anyone can open.

Does not count: a 3D render, a PCB viewer, a generated snapshot, a simulator screenshot, a render of an enclosure. A thing that only exists as an image has not run.

If the project runs on several devices, say which one the proof was captured on. Supporting three devices and having run on one of them are different claims, and the reader who buys the wrong one finds out the hard way.

**2. A new category needs at least two projects.**

Add your project to a category that already exists in the README. If nothing fits, say so in the pull request and propose the category, then expect it to wait until a second project of its kind shows up. A category with one entry says nothing.

The rest of this document is the detail.

## What gets in

Three gates. A project needs all three, and one missing gate is a no whatever the other two look like.

1. **Public source you can build.** A repository, not a video-only showcase. If the code is not there, it is not an entry.
2. **Evidence it ran on real hardware.** Rule 1 above: a photo, a video, or a live demo, linked in the pull request, naming the device it was captured on when the project supports more than one.
3. **Someone else could reproduce it.** The README names the board and says how to flash it.

Then:

- **Stars are not a criterion.** A 0-star project can be more interesting than a 2k-star one, and often is. Do not argue for an entry with its star count, and do not argue against one either.
- **Self-promotion is welcome and must be disclosed.** Submitting your own project is fine, say it is yours in the pull request. The same three gates apply.
- **Any device with an ESP32 chip qualifies.** Dev kits, Waveshare, M5Stack, LilyGO, Seeed, Adafruit, or a commercial product that happens to run an ESP32 are all equally welcome. The list is not about one vendor or one board.
- **An entry belongs to one purpose category.** Hardware never justifies a new category, the device name at the end of the line carries it.

## Adding a project

- One project per pull request, with a short PR title like `Add project-name`.
- Add it to the bottom of the category that fits best, per rule 2 above.
- Format: `- [name](link-to-repo) - What it is, one sentence ending with a period.`
- **Name the device you built it on**, spelled exactly as [devices.md](devices.md) spells it. That spelling is what makes a search of the README find every project for one piece of hardware, so `Waveshare ESP32-S3-Touch-AMOLED-1.8` and `the AMOLED board` are not interchangeable.
- **If your device is not in [devices.md](devices.md) yet, add it in the same pull request.** A section is three lines: the exact name as its maker spells it, one line of what it is (chip, screen, what it has built in), and a link to the maker's product page. There is no bar to clear, the first project to use a device is the one that adds it.
- If several devices are involved, say which: all of them required, one of them at your choice, or one plus optional extras. A reader is deciding what to buy.
- Some projects honestly have no device. Firmware that runs on dozens of boards points at its own compatibility list, and a build from a bare ESP32 plus parts says so. Do not invent a device to satisfy the rule.
- The link must point to a **source repository** (or the closest thing to one). Product pages, videos, and blog posts can complement it as a trailing `([demo](url))`, never replace it.
- Descriptions state what the project does, not that it is "awesome", "simple", or "blazing fast".
- The project should be alive: builds against a current toolchain, or is finished and still works.

## Categories and devices

The Applications tree answers one question, what a project is for. Hardware facts answer a different one and ride at the end of the entry line, so a board never creates a category.

Every entry ends with the device it runs on, in backticks, spelled exactly as
[devices.md](devices.md) spells it: `` `Waveshare ESP32-S3-Touch-AMOLED-1.8` ``. Several
devices are joined by `and` when all of them are required, `or` when it is your choice.

There are no tags. A project with no single device ends with nothing, and says in
`devices.md` what it takes instead: an ESP32 plus parts you pick, any board carrying the
right screen, or a firmware ecosystem with its own compatibility list. Do not invent a
device to fill the slot, and state only what the project's own README or demo states.

## Removing or moving a project

Dead links, abandoned repos, and better-fitting categories are all fair PRs. Categories themselves are provisional; restructuring proposals are welcome once a section grows past a dozen entries.
