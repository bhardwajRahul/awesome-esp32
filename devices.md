# Devices

Every entry in the [README](README.md) names the device it runs on. This file spells
each name and links where to buy it. Use the name here, character for character, so a
search of the README finds every project that runs on the same thing.

A device gets a section the first time one project uses it. Projects that run on a bare
ESP32 plus parts, or on dozens of boards, name no device and are listed at the bottom.

## Waveshare ESP32-S3-Touch-AMOLED-1.8

ESP32-S3, 368x448 touch AMOLED, IMU, ES8311 audio codec, battery support. Shipped with
two panel controllers (SH8601 on V1, CO5300 on V2) that firmware must be built against;
the bus is write-only, so the board cannot report which one it has.
[Product page](https://www.waveshare.com/product/esp32-related/boards-kits/esp32-s3/esp32-s3-touch-amoled-1.8.htm) ·
[field guide](guides/waveshare-amoled-18.md)

## Waveshare ESP32-S3-Touch-AMOLED-2.06

ESP32-S3R8, 410x502 touch AMOLED, QMI8658 6-axis IMU, battery support. Larger sibling of
the 1.8 and a different device: pin map, panel and drivers do not carry over.
[Product page](https://www.waveshare.com/esp32-s3-touch-amoled-2.06.htm)

## Waveshare RP2350-Touch-AMOLED-1.8

The same 368x448 touch AMOLED shell as the ESP32-S3 board, on an RP2350 instead. Present
here because projects port across the two rather than living on one.
[Product page](https://www.waveshare.com/rp2350-touch-amoled-1.8.htm)

## Waveshare ESP32-P4-ETH

ESP32-P4 with wired Ethernet and an ESP32-C6 radio co-processor.
[Product page](https://www.waveshare.com/esp32-p4-eth.htm)

## Waveshare ESP32-P4-Module-DEV-KIT

ESP32-P4 dev kit driving a 7-inch DSI touch panel.
[Product page](https://www.waveshare.com/esp32-p4-module-dev-kit.htm)

## M5StickS3

ESP32-S3 stick with a small display, IMU, microphone and battery.
[Product page](https://shop.m5stack.com/products/m5sticks3-esp32s3-mini-iot-dev-kit)

## M5Stack CoreS3

ESP32-S3 in the stackable Core case: 320x240 touch screen, IMU, camera, microphone,
speaker, battery base.
[Product page](https://shop.m5stack.com/products/m5stack-cores3-esp32s3-lotdevelopment-kit)

## Ulanzi Smart Pixel Clock TC001

A shipped consumer clock built on an ESP32 driving a 32x8 addressable LED matrix, with
light and temperature sensors, buttons and a battery.
[Product page](https://www.ulanzi.com/products/ulanzi-pixel-smart-clock-2882)

## TRMNL

A shipped ESP32-C3 e-ink dashboard, sold assembled, with a plugin ecosystem behind it.
[Product page](https://trmnl.com)

## No single device

These projects name no device on purpose, and adding one would misrepresent them.

- **Firmware ecosystems** run on dozens of boards and publish their own compatibility
  list: Tasmota, WLED, Meshtastic, ESPHome, xiaozhi-esp32.
- **Builds from parts** are a bare ESP32 plus components chosen by the builder:
  InkSight (ESP32-C3 board plus a 4.2-inch e-paper panel), squeezelite-esp32,
  esp32_basic_synth, OpenEPaperLink (repurposed shelf labels, many models).
- **Board-agnostic firmware** runs on whatever carries the right screen or MCU:
  HomePoint, esp32-lvgl-watchface, Midbar.
