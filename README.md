# awesome-esp32

Hand-picked ESP32 projects worth building, copying, or just watching run. Every entry links to a working repository; demo links are kept when the demo is the point.

Two top-level sections: **Applications** are actual things people have built and run on an ESP32; **Tools, utilities & libraries** is what you build them with. Subcategories are provisional and will be reshaped as the list grows. See [CONTRIBUTING.md](CONTRIBUTING.md) to add a project.

## Applications

### Companions & AI devices

- [chat-stick](https://github.com/steveruizok/chat-stick) - Hold-to-talk voice interface to Gemini Live on an ESP32-S3 stick, with persistent timers, server-side tools, and OTA updates.
- [xiaozhi-esp32](https://github.com/78/xiaozhi-esp32) - MCP-based AI chatbot firmware powering a whole ecosystem of talking desk companions.
- [pixelcat](https://github.com/toddsherman/pixelcat) - Tamagotchi-style pixel cat on an ESP32-S3 AMOLED handheld that learns your schedule, reacts to touch and sound, and can never irrecoverably die.

### Displays & ambient screens

- [trmnl firmware](https://github.com/usetrmnl/firmware) - Firmware behind the TRMNL e-ink dashboard, an ESP32-C3 driving a battery-friendly plugin ecosystem.
- [awtrix3](https://github.com/Blueforcer/awtrix3) - Turns an Ulanzi pixel clock into a scriptable smart display with a large community of apps.
- [OpenEPaperLink](https://github.com/OpenEPaperLink/OpenEPaperLink) - Repurposes electronic shelf labels into a wireless e-paper display network with an ESP32 access point.
- [HomePoint](https://github.com/sieren/HomePoint) - A small ESP32 screen for switching MQTT and HomeKit devices.
- [esp32-lvgl-watchface](https://github.com/fbiego/esp32-lvgl-watchface) - Renders smartwatch binary watchfaces on a 240x240 LVGL screen, with a converter that turns watchface files into compilable code.

### Home & ambient

- [Tasmota](https://github.com/arendst/Tasmota) - Flash-and-forget firmware giving off-the-shelf smart plugs and lights local MQTT control.
- [WLED](https://github.com/Aircoookie/WLED) - The addressable-LED firmware, with effects, segments, and an ecosystem of controllers built around it.

### Creative & play

- [tinydraw](https://github.com/aliceisjustplaying/tinydraw) - Finger-drawing app for ESP32-S3/RP2350 touch AMOLED handhelds, with variable-width ink, zoom, undo, and SVG/PNG export.
- [infinite-golf](https://github.com/MikeWilson/infinite-golf) - Procedurally generated mini-golf on an ESP32-S3 AMOLED handheld; you physically swing the device and the IMU measures the shot.
- [esp32-gameos](https://github.com/MikeWilson/esp32-gameos) - A handheld gaming OS for the same AMOLED device: launcher plus six fully procedural games at 60 fps, no engine, no asset files.

### Audio & music

- [squeezelite-esp32](https://github.com/sle118/squeezelite-esp32) - Multi-room audio player and AirPlay/Spotify/Bluetooth endpoint on a bare ESP32.
- [esp32_basic_synth](https://github.com/marcel-licence/esp32_basic_synth) - A polyphonic MIDI synthesizer from one chip and a DAC.

### Radio & mesh

- [Meshtastic](https://github.com/meshtastic/firmware) - Off-grid, encrypted LoRa mesh messaging; the reference ESP32 radio project.

## Tools, utilities & libraries

### Frameworks & languages

- [ESP-IDF](https://github.com/espressif/esp-idf) - Espressif's official development framework.
- [esp-hal](https://github.com/esp-rs/esp-hal) - Bare-metal Rust for ESP32 chips.
- [MicroPython](https://github.com/micropython/micropython) - Python on the chip, with first-class ESP32 support.
- [ESPHome](https://github.com/esphome/esphome) - Describe a device in YAML, get firmware; the default way ESP32s enter Home Assistant.

### Utilities & SDKs

- [ESP Web Tools](https://github.com/esphome/esp-web-tools) - Flash firmware from the browser over WebSerial, no toolchain installed.
- [openHASP](https://github.com/HASwitchPlate/openHASP) - Build custom touchscreen control panels for home automation, driven over MQTT.
- [psiop](https://github.com/aap/psiop) - A compact software 3D rendering library for the ESP32.
- [openai-realtime-embedded](https://github.com/openai/openai-realtime-embedded) - OpenAI's official SDK for talking to the Realtime API over WebRTC from an ESP32-S3.

## License

[CC0 1.0](LICENSE). Descriptions belong to their projects' authors where quoted.
