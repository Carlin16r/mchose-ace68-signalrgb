# MCHOSE Ace 68 (`3837:3003`) – lighting protocol notes

Obtained by hooking `HIDDevice.sendReport` / `inputreport` in the vendor's web driver while changing
colors. Not official. Everything below was observed on one unit.

## Transport

- USB HID, **interface 1** (the one the web driver opens), 64‑byte output reports, **report ID 0**.
- The keyboard answers every write with an input report.

## Packet layout (host → device)

```
byte 0     0x55                     header
byte 1     command
byte 2     0x00
byte 3     checksum                 sum(bytes[4..63]) & 0xFF
byte 4     length                   0x38 (56)
byte 5-6   offset (little endian)
byte 7     0x00
byte 8..63 56 bytes of data
```

Verified checksum examples: `55 0b 00 51 38 18 01 …` → `0x38 + 0x18 + 0x01 = 0x51`.

## Commands seen

| cmd  | meaning (observed)                                                         |
|------|------------------------------------------------------------------------------|
| `f1` | read a 56‑byte block at `offset` (config storage)                           |
| `f2` | write a 56‑byte block at `offset` (the web driver stores preset names / sync markers) |
| `0b` | **write per‑LED colors**                                                     |
| `03`,`04`,`05`,`a9` | short commands sent during initialization (not decoded)               |

## Lighting (`0b`)

- 128 LED slots × 3 bytes (R, G, B) = 384 bytes, sent as 7 blocks at offsets
  `0x00, 0x38, 0x70, 0xA8, 0xE0, 0x118, 0x148` (the last block overlaps the previous one).
- LED `n` occupies bytes `n*3 .. n*3+2` of the 384‑byte array. Only 68 slots are real keys.
- No begin/end packet is needed between blocks.

## Acknowledgement (device → host)

After each `0b` block the keyboard sends an input report:

```
aa 0b 00 <checksum> 38 <off_lo> <off_hi> …
```

It also sends `55 0b …` echoes. **Sending the 7 blocks without waiting for the `aa` ACK drops blocks**
(only some keys change). Waiting for the ACK of the matching offset fixes it.

## LED index → key (hardware order)

```
Esc 26   1 64   2 22   3 2    4 60   5 38   6 78   7 76   8 27   9 67   0 65   - 5    = 28   Backspace 8   Insert 70
Tab 66   Q 4    W 83   E 0    R 40   T 18   Y 16   U 47   I 7    O 25   P 45   [ 68   ] 48   \ 30          Del 10
Caps 46  A 81   S 80   D 82   F 58   G 36   H 56   J 3    K 41   L 12   ; 52   ' 72   Enter 34            PgUp 50
LShift 6 Z 44   X 49   C 29   V 9    B 69   N 43   M 23   , 21   . 1    / 32   RShift 54   Up 53   PgDn 55
LCtrl 11 LWin 71  LAlt 31  Space 63  RAlt 61  Fn 14  RCtrl 74  Left 33  Down 73  Right 13
```

## Open questions

- Do `0b` writes go to RAM or flash?
- Brightness: the web driver has a `setLightConfig` (type / effect / brightness / speed) that was not decoded.
  The plugin sends raw RGB and relies on the keyboard's current brightness.
- Wireless / 2.4 GHz / Bluetooth behavior.
