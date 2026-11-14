# MCHOSE Ace 68 (`3837:3003`) – SignalRGB plugin

Community plugin that lets [SignalRGB](https://signalrgb.com) control the per-key RGB of the
**MCHOSE Ace 68** (USB name `Ace 68 -III`, VID `0x3837`, PID `0x3003`), the model that is configured with
the web driver at mchose.com.cn ("M HUB").

> **Not the same as the other Ace 68 plugin.** A different Ace 68 variant (`41e4:2116`) already has a
> community plugin with a different protocol. This one only targets `3837:3003`. Check your USB IDs first
> (Device Manager → keyboard → Details → Hardware Ids).

## Status

- Tested on one unit, wired USB, Windows 11, SignalRGB 2.5.x.
- Canvas effects, forced color and key‑press reactive effects work.
- Wireless / 2.4 GHz / Bluetooth modes were **not** tested.
- Written from captured WebHID traffic, not from vendor documentation. See [PROTOCOL.md](PROTOCOL.md).

## Install

1. Close the MCHOSE web driver in every browser tab (only one program can open the keyboard at a time).
2. Copy `Mchose_Ace68.js` to your SignalRGB custom plugins folder, usually
   `Documents\WhirlwindFX\Plugins` (it can be under OneDrive: `OneDrive\Documents\WhirlwindFX\Plugins`).
3. Restart SignalRGB. The keyboard should show up as **Mchose Ace 68** (type: Keyboard).
4. If the device shows nothing, check the **Device terminal** in SignalRGB. The plugin logs the frame
   counter and the ACK statistics, for example `ACK ok=504 falhas=0`.

## Known limitations and warnings

- **Flash wear is unknown.** I could not confirm whether the lighting blocks are kept only in RAM or are written
  to the keyboard's flash. Don't leave the plugin running 24/7 until someone confirms this.
- The plugin only changes lighting. It does not touch key mapping, macros or the profile settings.
- **Onboard profiles:** every onboard profile has its own lighting area in the keyboard memory. The plugin
  reads the active profile (command `04`) and writes to that profile's area, following profile switches.
  Profile 1 (`0x0000`) and profile 3 (`0x0400`) were observed with the vendor web driver; the area of
  profile 2 (`0x0200`) is inferred from the spacing. If the colors go to the wrong place, pick the profile
  by hand in the plugin setting **Onboard Profile**.
- **The profile's lighting mode must be "Custom"** in the web driver (Lighting → Custom). If a profile uses
  "Normal light" (one of the keyboard's built-in effects), the keyboard shows that effect and ignores
  SignalRGB. Forcing the mode from the plugin is not implemented yet (a command `06` seems to write it).
- Don't keep the web driver open while SignalRGB controls the keyboard; both write to it.
- The keyboard must acknowledge every block (`aa 0b …`). The plugin waits for these ACKs; without them parts
  of the keyboard stay on old colors.
- Layout is in real key units (quarter‑key grid, 61×17). Other layouts (ISO, other Ace 68 revisions) were not tested.

## Credits / license

Protocol reverse engineered by capturing the keyboard's own web driver. Use at your own risk, no warranty.
See `LICENSE`.

---

# Português

Plugin da comunidade para o SignalRGB controlar o RGB por tecla do **MCHOSE Ace 68** (`3837:3003`, nome USB
`Ace 68 -III`), o modelo configurado pelo driver web mchose.com.cn ("M HUB").

**Instalação:** feche o driver web em todas as abas, copie `Mchose_Ace68.js` para
`Documentos\WhirlwindFX\Plugins` (ou a pasta equivalente no OneDrive) e reinicie o SignalRGB.

**Avisos:** testado em apenas uma unidade, por cabo USB. Modos sem fio não foram testados. Não sei se os
blocos de iluminação gravam na memória flash do teclado, então evite deixar o plugin rodando o tempo todo
até isso ser confirmado. Use por sua conta e risco.
