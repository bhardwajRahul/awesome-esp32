# Building on the Waveshare ESP32-S3 Touch AMOLED 1.8

Field notes distilled from the projects on [the list](../README.md) that ship on this board: [tinydraw](https://github.com/aliceisjustplaying/tinydraw), [esp32-gameos](https://github.com/MikeWilson/esp32-gameos), [infinite-golf](https://github.com/MikeWilson/infinite-golf), [esp32-fluidbox](https://github.com/V4C38/esp32-fluidbox), [pixelcat](https://github.com/toddsherman/pixelcat), the [puck](https://github.com/s0lness/puck) esp32 pack, plus [pocket-pet](https://github.com/frolic/pocket-pet) (its sibling 2.06 board, same family of traps) and [psiop](https://github.com/aap/psiop) (software 3D worth porting). Everything below was measured on real hardware by at least one of them; where projects disagree, the disagreement is noted.

## The board at a glance

| Part | Chip | Where |
|---|---|---|
| MCU | ESP32-S3 (dual Xtensa 240 MHz), 16 MB QIO flash, 8 MB octal PSRAM | |
| Panel | CO5300 AMOLED, 368x448 RGB565, QSPI (V2 boards; original rev is SH8601) | SPI2_HOST: SCLK 11, D0..D3 = 4/5/6/7, CS 12, TE on GPIO13 |
| Touch | CST820 (CST816S-compatible; original rev FT3168), single point | I2C 0x15, SDA 15, SCL 14, INT 21 |
| IMU | QMI8658 accel+gyro | I2C 0x6B or 0x6A, probe both |
| Audio | ES8311 codec, speaker amp, mic | I2S: MCLK 16, BCLK 9, WS 45, DOUT 8; PA enable GPIO46 |
| PMIC | AXP2101: li-po charging, fuel gauge, power button | I2C 0x34 |
| RTC | PCF85063A | I2C 0x51 |
| IO expander | TCA9554: panel reset/power, touch reset, SD CS, second button | I2C 0x20 |
| Buttons | BOOT (GPIO0 strap), PWR (behind expander + PMIC) | |

Several vendor docs claim the V2 panel is an SH8601. It is a CO5300 (gameos). Detect the board revision by probing the touch address: CST820 answering at 0x15 means V2, which also needs a 16 px panel x-gap (`esp_lcd_panel_set_gap(panel, 0x10, 0)`) and a hotter audio base volume (fluidbox, gameos, pixelcat all use this probe).

## Project setup

- ESP-IDF 5.5 or 6.x all work; pin one (tinydraw pins 6.0.2, fluidbox 5.5.5, gameos requires 6.x). Commit `dependencies.lock`.
- Components worth pinning: `espressif/esp_lcd_co5300` (^2.1.0), `waveshare/qmi8658` (^2.0.0). The full Waveshare BSP works (golf uses it) but every project that chased performance ended up driving the panel directly.
- sdkconfig lines that earn their place, each measured by someone: `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240` (golf forgot it and rasterizes at the 160 MHz default), `CONFIG_COMPILER_OPTIMIZATION_PERF`, `CONFIG_SPIRAM=y` + `CONFIG_SPIRAM_MODE_OCT` + `CONFIG_SPIRAM_SPEED_80M`, `CONFIG_FREERTOS_HZ=1000` (lets a 60 fps pacer sleep in 1 ms steps), a main task stack of 6-16 KB (the 3584 default overflows on the first big local array).
- Flash is 16 MB; use it. tinydraw's table: 1.75 MB app, 4 MB journal, 10 MB export volume, 64 KB coredump. Oversized-app trap from the 2.06 board: a factory image that outgrows its partition still "flashes successfully", then the bootloader silently boots a stale OTA slot and you debug a build from last week.

## Display: the CO5300

**Clock.** The co5300 component defaults to 40 MHz, which caps a full 368x448 frame around 52-54 fps. Every game asks for 80 MHz in `esp_lcd_panel_io_spi_config_t` and gets it (fluidbox measured 90+ fps; gameos holds 60.0). tinydraw asked for 40/50/60 and measured 40 MHz actual with its config, so verify with your own numbers. The QSPI pins go through the GPIO matrix, not IOMUX; if you see corruption at 80, fall back to 40 and say so in a comment.

**Init.** The 11-command power-on sequence is load-bearing and hand-written in every project: `0xFE page`, `0xC4`, `0x3A=0x55` (RGB565), `0x35=0x00` (TE on), `0x53`, `0x51` (brightness), `0x63`, full-window `0x2A/0x2B`, `0x11` + 100 ms, `0x29`. Do not let the component or BSP re-take panel init if you set your own clock.

**No framebuffer needed.** The proven pattern (fluidbox, pixelcat, puck, gameos) is band rendering: 16 bands of 28 rows, two `DMA_ATTR` band buffers in internal SRAM (~20 KB each), `esp_lcd_panel_draw_bitmap` queues DMA and returns, a counting semaphore initialized to 2 and given from the `on_color_trans_done` ISR gates buffer reuse. Rotate buffers by acquisition count, not band index, or skipped bands hand one buffer to two in-flight transfers (fluidbox). Keep pixels out of PSRAM on the hot path: CPU writes and DMA reads contend on the same external bus. gameos goes further: render indexed 8bpp at 184x224 in internal SRAM and apply the palette during a 2x upscale inside the flush task, which halves bandwidth and makes palette animation free.

**Windows are 2px-aligned.** The panel rejects odd x/y/w/h draw windows (tinydraw enforces even alignment; gameos gets it by construction with full-width bands at even y).

**QSPI commands must be framed.** `esp_lcd_panel_io_tx_param(io, 0x51, ...)` with a bare command silently does nothing: the CO5300 QSPI path wants the command shifted under a 0x02 write opcode, `(0x02 << 24) | (cmd << 8)`. Both gameos and pixelcat lost time to "brightness does nothing" before finding this.

**The panel IO is not thread-safe.** A `tx_param` racing in-flight color DMA wedges the pipeline; the symptom is a frozen screen with dead buttons and no error anywhere. Route every panel command through the flush task at its one safe point, after DMA drains (gameos `pending_brightness` handoff; pixelcat takes both band semaphores first).

**Tearing.** TE is on GPIO13 at 59.62 Hz (tinydraw measured 16,773 us period, 578 us high). tinydraw waits for a rising edge with a 40 ms timeout before full-frame sweeps and re-issues TEON after `disp_on` because the init-list TEON is ignored on marginal boots. fluidbox and the games skip TE entirely and accept occasional tear at 80 MHz. Choose one deliberately.

**The panel can boot dark or wedge, and it survives your reboots.** The panel reset line is on the TCA9554 expander, not an ESP32 pin, so a chip reset (or an esptool reflash interrupting QSPI mid-transfer) can leave the controller wedged: every command returns OK into a black screen. Power-cycle the panel through the expander on every boot; tinydraw retries the sequence 3 times with I2C bus resets, pixelcat needed two 50 ms pulses where one 20 ms pulse left it dark. Related trap from the battery: latched panel/PMIC state survives USB unplug and reflash, and only a long PWR hold (full AXP2101 power-off) or battery disconnect clears it, so "same firmware, different behavior across days" is often your own earlier firmware's leftover state.

**Sleep traps.** To blank the screen use display-off (`0x28`) alone; GRAM survives and display-on brings it back. Sleep-in (`0x10`) plus an init replay came back lit but never updated again (pixelcat). Never configure GPIO13 as anything, even floating input, on these boards; it latches the panel into corruption (pocket-pet, Waveshare issue #6). On the 2.06 sibling, `CONFIG_ESP_SLEEP_GPIO_RESET_WORKAROUND` must stay off or the first light sleep floats the QSPI bus and latches the panel permanently.

**Instrument the pipeline.** Expose tx_ok/tx_err/free-slots counters (pixelcat) and log an fps line every few hundred frames (gameos). A wedge with no counters looks identical to a coding bug.

## Memory

- PSRAM is for big cold data: world buffers, journals, tile pools, multi-MB game state. Internal SRAM is for pixels in flight, DMA buffers (`MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL`), and audio chunks.
- tinydraw's steady state on this board: ~223 KB internal free, dipping to ~85 KB during USB export; PSRAM 8 MB with ~1 MB free after a 5 MB tile pool. Budget explicitly; fluidbox capped particles at 1000 because 1200 overflowed static DRAM at link time.
- `heap_caps_malloc(MALLOC_CAP_SPIRAM)` with a plain-malloc fallback that cannot possibly fit in internal RAM is dead code that hides failures (golf); prefer failing loudly.
- Large locals overflow the default main stack. Make them static or heap-allocate.

## Touch

- Single point only. Design nothing two-finger.
- The controller auto-sleeps after release and NACKs I2C until the next contact: a failed read means "no finger", never "keep last state" (gameos). pixelcat instead disables auto-sleep by writing `0xFE = 0x01` (the reset pin is not wired, so a stuck controller stays stuck).
- Parallax is real and measured: contact registers 15-25 px below the aimed target at this glass thickness (gameos, from logged coordinates). Subtract a y bias before hit-testing, extend zones ~20 px below their visual, and never ship a touch row under ~40 px tall.
- The panel flickers during holds and drops release edges. Fire menu actions on press-edge or release-tap, whichever comes first, with a consumed guard; make destructive/launch actions release-only; tolerate brief release gaps in hold timers (gameos shipped all three rules after user reports).
- Log every touch down/up with coordinates at INFO permanently. That log is how the parallax numbers were obtained, and it turns "menus do nothing" reports into per-press traces.

## IMU: the QMI8658

- Probe both I2C addresses before init; blind-initializing the wrong one logs scary WHO_AM_I failures (golf, fluidbox, gameos all probe).
- Soft reset, then CTRL1 = 0x60 (address auto-increment) before burst reads, or reads return pegged garbage (pixelcat). `#undef M_PI` before the vendor header; it redefines it. The component's `_mg`/`_dps` read variants are declared but not implemented; use `qmi8658_read_accel/gyro`.
- Working config across projects: accel ±4 to ±8 g at 250 Hz ODR, gyro ±512 dps, explicit units.
- **Axis orientation is a per-unit fact, not a constant.** Two boards of the same revision had accel +Y pointing screen-left where the firmware author's unit had it screen-right; the same code aims left-right backwards on one of them (gameos, measured 2026-08-19 by recording gravity during guided tilts). Options that shipped: measure once and write the mapping table into config with the raw observations as comments (fluidbox), or make the map runtime data set by a guided wizard: hold neutral, tilt top edge, tilt left edge, watch which axis moves >=0.25 g sustained (gameos TILT SETUP). Golf sidesteps the problem entirely: its swing works relative to a measured backswing direction in the sensor's own frame, so orientation cancels.
- No magnetometer, so yaw drifts without bound. Fuse pitch/roll only and never build gameplay on yaw.
- Filtering that works: complementary filter around 0.96 at 200 Hz (gameos); one-pole low-pass with the coefficient derived from cutoff and dt so it is frame-rate independent (fluidbox `k = 1 - expf(-2*pi*f_c*dt)`); gyro signs learned online by correlating integrated rate against accel deltas, which absorbs sign errors within a second (gameos).
- Gesture detection: sample at 200+ Hz into a ring and drain every sample per frame; frame-rate polling aliases short bursts. Use explicit state machines with a settle phase, and integrate acceleration over the stroke instead of reading peaks; a peak at 100 Hz falls between samples and does not reproduce (golf's swing, stated in code comments).
- The on-die pedometer never produced a count on the sibling board despite verified configuration; software step detection over the chip's 128-sample FIFO worked, drained once a second (pocket-pet). Mutex all IMU access if two tasks read it; interleaving a register read into the FIFO handshake jams the engine.

## Audio: the ES8311

- `bsp_audio_codec_speaker_init()` boot-loops on this board; the vendor's own example says so. Hand-roll instead: I2S std config on the BSP pins, `auto_clear = true`, Philips slot, 16-bit mono, then `esp_codec_dev` with `ESP_CODEC_DEV_WORK_MODE_DAC` and `pa_pin = GPIO46` (golf found the recipe, gameos hardened it).
- The `i2s_channel_disable ... has not been enabled` error during open is benign; both projects silence the `i2s_common` log tag around the call.
- V2 boards need base volume ~90 where V1 wants ~70 (the same touch-probe revision check).
- Full duplex works: pixelcat runs `ESP_CODEC_DEV_WORK_MODE_BOTH` and reads one mic frame per speaker frame at 16 kHz. Its sound trigger is worth copying: RMS above an adaptive ambient floor by a ratio and an absolute margin, asymmetric EMA (fast down, slow up), gated for 350 ms after the speaker played so it cannot hear itself.
- Procedural beats assets: gameos ships an 8-voice chip synth (22 kHz mono, note tables in flash, Q32 phase accumulator, priority-based voice stealing) and zero PCM files. Anything heard every 20 seconds grates; celebrate rare events, mute frequent ones.

## Power, battery, buttons

- The board ships battery-optional and the AXP2101 answers regardless, reporting 0% SOC with no pack. Read REG 0x00 bit 3 (battery present) first; treat absent or 0% as "no reading", or your low-battery UI fires forever on USB power (gameos shipped that bug; tinydraw and this guide's own bring-up read the bit).
- Read raw VBAT mV (regs 0x34/0x35) alongside the gauge percent; a flat cell and an uncalibrated gauge look identical at 0% (pixelcat).
- A ~6 s PWR hold is wired straight into the AXP2101 and cuts power in hardware. Leave it; implement only the short-press/long-press UX (tinydraw masks the timing register to 4 s, fluidbox deliberately defers to the hardware).
- The PWR button reads through the TCA9554. When touching the expander, read-modify-write a single bit; the other bits hold panel and SD resets (fluidbox warns loudly).
- Light sleep: on battery, sleep in short slices and poll wake sources (BOOT GPIO low-level wake works; the PMIC IRQ is not routed). On USB, do not light-sleep at all: it drops enumeration and the board becomes unflashable until BOOT-mode recovery (pixelcat). The USB serial-JTAG PHY also blocks light sleep whenever VBUS is present. pixelcat's wake path is `esp_restart()` after persisting, re-entering the known-good boot path instead of resuming into stale peripheral state.
- Sample the battery during sleep, not just awake; most of the discharge curve happens there.

## USB and serial

- One USB PHY serves both Serial-JTAG (console + flashing) and OTG. tinydraw swaps them at runtime for its mass-storage export and restores the console without rebooting; if you need USB device modes, that file (`usb_export.cpp`) is the reference.
- ESP-IDF v6's default no-driver Serial-JTAG console cannot read: stdin sizes fetches from a function that returns 0 without the driver installed, so the RX FIFO is never drained and the host blocks on write. Install the driver for RX; keep console writes on the no-driver path, which drops output after 50 ms when no host listens instead of blocking forever (puck esp32 pack, found on the bench).
- Corollary of that 50 ms drop: the first reply after a host connects gets welded onto a half-dropped log line. Emit a fresh `\r\n` before every protocol reply so replies always start a line (puck devlink).
- The host's DTR/RTS lines are wired to the chip's strap/reset. Opening the port naively reboots the board or presses BOOT for you. Open with DTR and RTS deasserted before `open()` (gameos docs give the pyserial recipe; puck drives it with `DEVLINK_DTR=0`).
- The port re-enumerates after every flash and reset. Scripted tooling must reopen in a retry loop rather than holding one handle.

## WiFi and BLE

- Nothing on this board needs the radio for its core job, and most projects ship with it off. The clean pattern is tinydraw's one-shot NTP: compile-time credentials in an untracked local header (empty SSID = radio never starts), raw `esp_wifi` STA bring-up, SNTP once, write the RTC chip, then tear everything down including netif and NVS. The radio lives for seconds.
- WiFi wants ~70 KB of internal heap at init. A display-heavy firmware can genuinely not have it: tinydraw's raster variant fails `wifi_nvs_load: no mem` at boot while its vector variant syncs fine from a different point in the lifecycle. Bring the radio up early or budget for it explicitly.
- BLE: NimBLE peripheral-only with `BT_NIMBLE_MEM_ALLOC_MODE_EXTERNAL` (heap in PSRAM) is the proven low-footprint config on the sibling board (pocket-pet).
- Radio-vs-display corruption is a documented misdiagnosis: on the 2.06 board the real cause was heap pressure making a hidden bounce-buffer malloc fail inside the SPI driver. Before designing "radio truce" choreography, check whether your flush path silently bounce-copies non-DMA buffers.

## Architecture that pays

- Layer strictly downward: app -> contract -> core services -> HAL -> drivers. gameos enforces "a game includes only gos.h" and its six games stay portable to a host simulator for free. puck goes further: the same app C compiles against the board pack and to wasm for a browser emulator, with pixel-exact diffs between the two.
- The winning app contract is small: init/update/render/suspend/teardown against a per-frame input struct, all state in one zeroed allocation, no file-scope mutable globals (the shell relaunches without rebooting).
- Fixed timestep with catch-up: if a frame overruns, run extra updates and skip renders. Never derive user-facing time from frame counts; golf's timers ran 2-4x slow under display contention until everything moved to wall clock.
- Task layout that works: game/sim loop and display flush on one core, IMU and audio on the other, meeting only at small double-buffered snapshots or lock-free single-writer structures. Every dedicated task gets a priority and a stated reason.
- Config with receipts: fluidbox's `config.h` records, for every constant, the measurement that set it and the alternatives tried and rejected. This is the cheapest documentation you will ever write and it stops re-proposing dead ideas.

## Testing without (and with) the hardware

- Compile your rendering and logic on the host. Every mature project here does it: gameos compiles the real gfx core plus real game sources with a 50-line stub and dumps frames; fluidbox builds its actual `render.c` against stub headers into PNGs; pixelcat runs weeks of simulated owner routine natively; tinydraw runs its shared core under QEMU and a macOS app; puck compiles firmware C to wasm and replays recorded traces deterministically.
- Simulators must assert claims, not render pretty pictures: pacing ("first enemy visible at 1.0 s, was 9.8"), scripted UI walks, bot-driven soak sessions, statistical audits of procedural generators over hundreds of seeds (gameos's categories).
- On hardware, keep a permanent low-rate instrumentation channel: fps line, touch/input logs, I2C error counters, free-heap prints. Serial is dead when unplugged, so long-running devices persist a black box instead: NVS boot journal with reset reasons, event CSVs, a RAM ring capturing only warnings and errors (pixelcat, pocket-pet).
- The two-strike rule (pocket-pet): two failed fixes for one symptom means your causal model is wrong. Stop patching and build the instrument that can falsify it. Its three-layer display bug fell in 90 minutes to a purpose-built test firmware after hours of symptom patches.
- For input-driven pixel-exact verification against real silicon, the puck harness pattern works on this board: a tiny line protocol over Serial-JTAG that injects touches/buttons and streams screenshots back (captured band by band, no framebuffer needed), diffed at tolerance zero against the emulator.
- Feel (tilt, swing, touch comfort) bottoms out at a human. Ship the measurement path (gameos's AIM TEST reports a 30-trial median; pass is under 1.2 s) and state plainly what still needs hands.

## Condensed do-not list

- Do not let the display component re-take panel init (40 MHz ceiling returns).
- Do not send panel commands from outside the flush path while DMA is in flight.
- Do not send a bare QSPI command byte; frame it under the 0x02 opcode.
- Do not put the hot framebuffer or band buffers in PSRAM.
- Do not configure GPIO13, ever.
- Do not wake the panel with sleep-in plus init replay; use display-off only.
- Do not call `bsp_audio_codec_speaker_init()`.
- Do not trust the AXP2101 percent without the battery-present bit.
- Do not hardcode IMU axis orientation as if all units match yours.
- Do not poll the accelerometer at frame rate for gestures.
- Do not build gameplay on yaw.
- Do not open the serial port with DTR asserted.
- Do not light-sleep while on USB power.
- Do not leave `CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240` and `COMPILER_OPTIMIZATION_PERF` unset in anything that renders.
- Do not ship a touch target under 40 px or hit-test the raw touch point.
- Do not claim a change works because it compiles or because one frame looks plausible.
