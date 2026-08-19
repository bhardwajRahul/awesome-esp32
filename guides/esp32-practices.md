# ESP32 development practices, mined from the list

Cross-project lessons from every application and tool on [the list](../README.md), board-agnostic. The battle-hardened fleet firmwares (Tasmota, WLED, ESPHome, openHASP) contribute a decade of production scars; the AI companions (chat-stick, xiaozhi-esp32), ambient displays (TRMNL, awtrix3, OpenEPaperLink, HomePoint, esp32-lvgl-watchface), audio projects (squeezelite-esp32, esp32_basic_synth) and Meshtastic contribute the domain-specific patterns. Everything here is cited to the project that learned it. For the Waveshare AMOLED 1.8 specifically, see [the board field guide](waveshare-amoled-18.md).

## Choosing a stack

- **ESP-IDF (C/C++)** when you need the metal: every performance-critical project on the list ends up here or on Arduino-with-IDF-underneath. Pin the IDF version and commit the lockfile.
- **Arduino + PlatformIO** is what most of the community firmwares actually ship (Tasmota, WLED, TRMNL, Meshtastic): the Arduino API over the IDF, with PlatformIO handling the board matrix.
- **ESPHome** when the device is configuration, not a product: YAML compiles to per-device C++, nothing is runtime-configurable, dead code never ships.
- **MicroPython** for iteration speed on chips with PSRAM; its own docs recommend an S3 with SPIRAM and warn that C2/S2 without it run out of RAM on TLS or display buffers.
- **esp-hal (Rust, no_std)** is real and CI-tested across the whole chip family, but crates are at varying maturity; budget for missing drivers.
- **ESP Web Tools** for distribution: flashing from the browser via a JSON manifest (per-chip-family binary parts with offsets), auto-detecting the chip. This is how ESPHome and WLED onboard non-technical users.

## Builds and the board matrix

- Pin everything. TRMNL's platformio.ini says it outright: no caret version specifiers, several deps pinned to git SHAs. Meshtastic regenerates protobuf code from a submodule and forbids editing generated files. Tasmota states minimum core versions with the security rationale.
- One codebase, many boards: layer the build. Meshtastic's shape scales to 12 architectures: a common base env, a per-architecture base (`esp32s3_base`), then a per-board env that contributes only the board name, partition table, one define and one include dir. Board metadata (hw model, support level, images) rides in custom keys consumed by a script that emits a build manifest.
- Gate features on capabilities, never on board or chip names: `HAS_SCREEN`, `SOC_*` macros, Kconfig `depends on SPIRAM`. WLED's docs call out the known rename traps when feature-detecting with `CONFIG_IDF_TARGET_*`. xiaozhi holds 70+ boards with a pure-virtual `Board` singleton where almost every capability getter has a null default: adding a board means implementing 8 methods, not 30.
- Board identity is an OTA safety property. xiaozhi forbids editing an existing board's pins for new hardware, because OTA channels are keyed by board identity and the stock image would overwrite your fork. Give every hardware variant its own identity and update channel.
- Annotate cost at the flag. Tasmota's feature defines each carry their price in the comment ("+4k4 code", "+10k code, 0k2 mem, 124 iram"); fluidbox-style config-with-receipts records the measurement behind every constant. Both stop dead ideas from being re-proposed.
- Memory tiers beat per-board tuning: Meshtastic classifies chips into TINY/SMALL/MEDIUM/LARGE by usable heap, sizes node databases and caches per tier, and static_asserts the budget so an oversized cache fails the build instead of the field.

## Memory discipline

- The two heap doctrines, pick one and mean it: ESPHome treats any heap allocation after `setup()` as a reliability bug (field crashes cited), deprecating even `std::string` returns in favor of buffer APIs. WLED allows dynamic allocation but wraps it in fallback ladders (`p_malloc`: PSRAM then DRAM) and guards a minimum contiguous block: ESP32s crash when the largest free DRAM chunk drops below ~10 KB.
- PSRAM is slower than it looks: ~15x slower than DRAM on classic ESP32, 2-4x on octal S3, and not DMA-capable on classic. Keep DMA buffers, ISR-touched code and hot pixel paths internal; put big cold state (world buffers, histories, task stacks even) in PSRAM. squeezelite pins task control blocks in DRAM with stacks in PSRAM; store-and-forward in Meshtastic takes 3/4 of free PSRAM for history.
- Reserve internal RAM before PSRAM eats it: `SPIRAM_MALLOC_ALWAYSINTERNAL` (small allocs stay fast) and `SPIRAM_MALLOC_RESERVE_INTERNAL` (WiFi/DMA headroom) are the two knobs xiaozhi ships tuned.
- Ban VLAs (WLED rule: task stacks are 2-8 KB and a runtime-sized array blows them silently). Large locals become static or heap. Codec threads need deep stacks (xiaozhi gives Opus 24 KB).
- static_assert struct sizes when persistence or budgets depend on them (Meshtastic asserts its 20-byte packet record and 40-byte warm node entry).
- Fragmentation: allocate early and reuse, `reserve()` vectors and strings at init, no malloc/free churn per frame or per packet. openHASP parses config line by line with one reused JSON document instead of loading whole files.

## Tasks, timing, watchdogs

- The `yield()` trap, spelled out by WLED: on ESP32, `yield()` never runs the IDLE task, so it does not feed the task watchdog; a busy custom task must `delay(1)`. The watchdog panic is the late symptom; before it, deleted-task memory leaks and timers silently stop.
- Never compare `millis()` directly: rollover at 49.7 days inverts the comparison. Meshtastic wraps every deadline in a `Throttle` helper and has a CI job that rejects raw comparisons. Watch sentinel values too: a deadline variable where 0 means "inactive" must be tested before the elapsed check.
- Pin by contention, not by convention: radio stack on one core, latency-critical work on the other (squeezelite pins Bluetooth entirely to core 0 to keep core 1 for audio; golf samples its accelerometer on the opposite core from the display-locked loop). Priorities follow data flow: capture must never miss a DMA window, so input > output > codec (xiaozhi runs them 8/4/2).
- One writer per state: funnel cross-task mutations through an event-bits pump or a schedule queue on the main task (xiaozhi's rule: callbacks may run anywhere, mutations only via `Schedule()`). openHASP learned the LVGL version of this: MQTT callbacks arrive on the network thread, and LVGL is not thread-safe, so commands queue for the main loop.
- Locks: know that FreeRTOS binary semaphores are non-recursive; a nested take with `portMAX_DELAY` hangs forever (Meshtastic redesigned around a lock-free core plus a token that makes forgetting the lock impossible).
- Wall clock for anything user-facing. Frame-counted timers ran 2-4x slow under display contention (gameos). And do not trust `time()` before NTP: chat-stick refuses to create timers while the epoch reads before 2024.

## Resilience: assume the crash

- Ship a bootloop ladder. WLED counts consecutive crashes in RTC memory (crashes more than 2 minutes apart reset the counter) and escalates one step per detection: restore config backup, then reset config, then roll back the OTA partition, then dump the filesystem to serial. ESPHome's safe_mode is the same idea with defaults worth copying: 10 attempts, boot declared good after 1 minute.
- Give the user a hardware escape: Tasmota erases settings after 7 fast power cycles and has an emergency reset triggered by tying Rx to Tx. TRMNL clears WiFi credentials on a 5 s button hold.
- Settings need generations: Tasmota writes config round-robin across flash sectors with an incrementing save counter and CRC, loads the newest valid one, and keeps a last-known-good file. WLED backs up config before every write and every OTA. Version your blobs and keep old struct layouts so migration is possible (pixelcat keeps retired layouts verbatim so sizes still match).
- Record why you died: a crash callback that stores stack addresses in RTC memory (Tasmota), a boot journal with reset reasons, and a black box on flash for devices that run unplugged (pixelcat tees warnings/errors into a capped ring; pocket-pet journals wake causes, sleep refusals and battery per dark session). Serial is dead exactly when you need it.
- Be careful with brownout: it is not reliably reported by `esp_reset_reason()` (WLED checks the RTC reset reason per core) and blindly restoring config on brownout is explicitly called a bad idea; flag it, do not act on it.
- Every peripheral failure should be non-fatal with a one-line consequence log ("no touch: the cat cannot be petted", pixelcat). The device always boots.

## OTA

- Two proven partition strategies: classic dual-app with rollback (ESPHome, xiaozhi), or Tasmota's safeboot: one big app slot plus a small factory recovery image, because two half-size slots waste flash. When flash is tight, two-step OTA (flash a minimal image that then pulls the full one) works but has a documented hard rule: never OTA minimal-to-minimal.
- Rollback has a subtle rule: `esp_ota_mark_app_valid_cancel_rollback()` acts on the boot partition, so only call it when the running partition is the boot partition, or you bless an image that never booted (ESPHome). Validate image metadata before writing (WLED embeds and checks release info at a fixed offset, refusing incompatible images).
- The oversized-image trap: a too-big app "flashes successfully", then the bootloader silently boots the stale image in the other slot, and you debug last week's firmware (pocket-pet). Check the "Loaded app from partition" boot line.
- Defer, do not interrupt: stage version + URL in NVS and apply on next boot, self-invalidating if the pending version is not newer (chat-stick). Never flash mid-interaction.
- Split app from assets: xiaozhi's v2 layout carves a downloadable assets partition (models, fonts, sounds, languages) so content updates without reflashing firmware.
- OTA to things that are not the ESP32 is the same pattern one level down: OpenEPaperLink updates its battery tags over the same block-transfer protocol as images, with a wake reason reserved for failed-OTA recovery.

## Connectivity

- Reconnect ladders, not loops: TRMNL's intervals are first-class persisted objects (retry 15/30/60 s for the API, 60/180/300 s for WiFi, fast-poll backoff by streak). Tasmota rescans every 44 minutes and only roams to an AP 10 dB better, which is the hysteresis that stops mesh-network flapping.
- Cache BSSID + channel with the credentials and pass them to connect: skipping the scan is the biggest real-world boot-latency win (chat-stick, Tasmota, ESPHome `fast_connect`).
- `WiFi.persistent(false)` on Arduino, or the core wears flash on every connect (chat-stick).
- MQTT: LWT with retained `online`/`offline` is the fleet heartbeat, but some brokers disconnect on retained messages (Tasmota ships the opt-out). On planned restart, publish offline yourself or delete the retained topic. openHASP re-publishes Home Assistant discovery when `homeassistant/status` announces the server came back, which is the fix for entities vanishing after an HA restart, and deliberately publishes `offline` first on connect to force subscribers to resync.
- Provisioning: captive portal (DNS wildcard + AP) is table stakes; Improv over serial/BLE is in every Tasmota build; xiaozhi supports SoftAP, BluFi and multi-SSID storage side by side. Set the DHCP hostname to something identifying, not "espressif".
- mDNS: advertise a custom service type with TXT records (`_wled._tcp` with a mac record, awtrix's `_awtrix._tcp` with id/name/type) so discovery does not depend on scraping HTTP.
- WiFi and BLE coexistence is a choice, not a default: Meshtastic makes them mutually exclusive per boot and releases the BLE controller memory to the heap when WiFi wins; squeezelite runs Classic BT and WiFi together but compiles BLE out and pins the whole BT stack to core 0. Pick a policy; do not discover one.

## Realtime audio and streaming

- Bounded queues everywhere, drop with a log, never block: xiaozhi caps its jitter buffer at 2.4 s of Opus frames and drops beyond it. An unbounded queue in an audio path is a latency bug that looks like a memory bug.
- Generation counters kill stale audio: bump a counter on barge-in/stop so in-flight frames from the previous turn are discarded on arrival (xiaozhi).
- Negotiate formats, do not assume them: sample rates come from the session handshake; version your binary framing and store the negotiated version (xiaozhi's protocol v1/v2/v3 with a header echo).
- DMA buffer sizing wants exact multiples of your block size; squeezelite documents both the clean case (512x12 for I2S) and the dirty one (SPDIF needs non-multiples or it stutters).
- The network stack is a real bottleneck: direct 24/96 FLAC streams stutter on an ESP32 because of TCP/IP throughput, and no task-priority tuning fixes it; the answer was proxying through the server in bigger chunks (squeezelite).
- Echo cancellation is a chip-class feature (S3-and-up with PSRAM); smaller chips get half-duplex push-to-talk, which is a legitimate architecture, not a compromise (chat-stick). Keep AEC running during playback if you want wake words while the device talks.
- A synth on one chip works by budgeting, not hoping: fixed polyphony decided at compile time, one buffer-size constant as the latency knob, audio loop owning one core with everything else exiled to the other (esp32_basic_synth).

## Battery and power

- Do the arithmetic first: TRMNL measures one full wake cycle (0.186 mAh), divides the pack by it, and every design decision follows (2500 mAh / 0.186 = 13,433 updates; 96 a day = 140 days). If you cannot state mAh per wake, you do not have a power budget.
- Architect as one pass: wake, work, sleep, not a loop that sometimes sleeps. Tear down in order (submit logs, WiFi off, panel sleep, GPIOs to input, filesystem deinit) and only then arm the timer (TRMNL). Wake into a clean boot rather than resuming stale peripheral state; pixelcat's wake path is `esp_restart()` after persisting.
- Wake-source APIs differ per chip (ext0/ext1/gpio_wakeup) and some need a pinMode first or they wake instantly; TRMNL's per-target ladder with `#error` on unknown chips is the copyable shape. `gpio_hold_en` keeps a latch through deep sleep.
- Polling beats listening at the microamp scale: OpenEPaperLink tags initiate every exchange (the AP never transmits unsolicited), sleep exactly the milliseconds the AP asks for, and degrade their check-in interval on AP loss (1 h, then 2 h, then daily). Result: ~9 uA average.
- Never light-sleep on USB power: it drops enumeration and the board becomes unflashable-looking (pixelcat); the USB serial-JTAG PHY blocks light sleep whenever VBUS is present anyway. On battery, sleep in short slices and poll wake sources; credit slept ticks back to the RTOS before anything tick-based runs (pocket-pet).
- Battery reading hygiene: fuel-gauge percent plus raw voltage (a flat cell and an uncalibrated gauge both read 0%), an OCV lookup table with per-chemistry variants, debounce low-battery over many consecutive readings, sample at most every few seconds through a gated divider, and sample during sleep too since that is where the discharge curve lives (Meshtastic, pixelcat).
- Role-based defaults scale better than per-device tuning: Meshtastic's solar router role changes a dozen interval defaults at once (GPS daily instead of every 2 minutes, telemetry 12 h instead of 1 h).

## Fleets, config and plugins

- There is a spectrum from config-over-code to code-over-config, and the list has both poles working at scale: Tasmota's device templates (a JSON GPIO map; one binary, thousands of devices, zero recompiles) versus ESPHome's YAML-to-C++ (one binary per device, dead code never ships). Decide where your boundary sits; the worst position is ad hoc.
- Runtime app ecosystems on static firmware are possible: awtrix3 apps are JSON payloads over MQTT/HTTP, persisted to flash, rendered through a fixed pool of pre-declared slots. TRMNL goes further: all plugin logic is server-side and the device is a pure renderer that reports its state in HTTP headers and obeys `refresh_rate` and `firmware_url` in the reply.
- Plugin registries that survive hundreds of contributors: Tasmota's numbered driver files crossed with a documented callback table where the cell value is execution order; WLED's linker-section registry (usermods register themselves, no central list to edit); ESPHome's 741 component directories with generated CODEOWNERS assigning every component a named owner.
- NVS keys and settings layouts are persistent API: changing one requires a migration, and the upgrade path becomes a documented chain (Tasmota's version-hopping table, with downgrade explicitly unsupported). Reject settings blobs from the wrong chip variant.
- Secrets: compile-time credentials make binaries unshippable; `strings` on a .bin recovers WiFi passwords and server URLs (chat-stick documents this against itself). Keep API keys off the device entirely behind a relay server; give devices at most a device token, and for provisioned hardware use efuse serials with the HMAC peripheral so the secret never leaves the chip (xiaozhi).
- Deprecation is a feature: ESPHome's public API is "what is documented", changes carry a removal version in the code, renamed YAML keys warn and auto-migrate for 6 months, and release notes are generated from PR descriptions.

## The condensed do-not list

- Do not `yield()` in a busy ESP32 task and expect the watchdog fed; `delay(1)`.
- Do not compare against `millis()` directly; wrap deadlines.
- Do not allocate in audio paths or after setup in long-running firmware; bound every queue.
- Do not put DMA buffers or hot pixel paths in PSRAM; do not trust PSRAM to exist.
- Do not let the largest free DRAM block fall below ~10 KB.
- Do not use VLAs or large locals on RTOS stacks.
- Do not ship OTA without a bootloop ladder, a config backup, and an image-compatibility check.
- Do not mark an OTA image valid unless the running partition is the boot partition.
- Do not OTA minimal-to-minimal.
- Do not reuse a board identity for different hardware.
- Do not store user-facing state in frame counts, or trust `time()` before sync.
- Do not compile secrets into binaries you distribute.
- Do not retain MQTT messages without an opt-out, or skip the LWT.
- Do not light-sleep while on USB power.
- Do not act on brownout automatically; log it.
- Do not hand-edit generated files (protobufs, codegen, lockfiles); fix the source of truth.
