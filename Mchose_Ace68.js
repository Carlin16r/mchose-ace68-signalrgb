// SignalRGB plugin - MCHOSE Ace 68 (USB VID 0x3837 / PID 0x3003, "Ace 68 -III")
// Protocol obtained by capturing the WebHID traffic of the vendor web driver (mchose.com.cn).
//
// Packet (64 bytes, report ID 0):
//   55 0b 00 <checksum> 38 <off_lo> <off_hi> 00 <56 data bytes>
//   checksum = sum(bytes[4..63]) & 0xFF
// Data = 128 LED slots x 3 bytes (R,G,B) = 384 bytes, sent as 7 blocks at offsets
//   0x00, 0x38, 0x70, 0xA8, 0xE0, 0x118, 0x148 (the last block overlaps the previous one).
// The keyboard answers every block with an input report "aa 0b 00 <cs> 38 <off_lo> <off_hi> ...".
// Blocks written without waiting for that ACK get dropped, so the plugin waits for it.

export function Name() { return "Mchose Ace 68"; }
export function VendorId() { return 0x3837; }
export function ProductId() { return 0x3003; }
export function Publisher() { return "Carlin16r"; }
// Not listed in the plugin docs I read, but SignalRGB uses it to treat the device as a keyboard.
export function DeviceType() { return "Keyboard"; }

// Grid of 0.25 key-unit per cell: 16 u wide -> 61 cells (indexes 0..60),
// 5 rows -> 17 cells (rows at 0, 4, 8, 12, 16). Keeps the proportions of the physical keyboard.
const GRID_W = 61;
const GRID_H = 17;
export function Size() { return [GRID_W, GRID_H]; }
export function DefaultPosition() { return [10, 100]; }
export function DefaultScale() { return 2.0; }

/*
global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/

export function ControllableParameters() {
	return [
		{ "property": "shutdownColor", "label": "Shutdown Color", "min": "0", "max": "360", "type": "color", "default": "#000000" },
		{ "property": "LightingMode", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Forced"], "default": "Canvas" },
		{ "property": "forcedColor", "label": "Forced Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
	];
}

// [hardware LED index, key name (SignalRGB key names), key center in key units (1 u = standard key), row]
// Real key widths: Backspace 2u, Tab 1.5u, \ 1.5u, Caps 1.75u, Enter 2.25u,
// Left Shift 2.25u, Right Shift 1.75u, left Ctrl/Win/Alt 1.25u, Space 6.25u.
const vKeyUnits = [
	[26, "Esc", 0.5, 0], [64, "1", 1.5, 0], [22, "2", 2.5, 0], [2, "3", 3.5, 0], [60, "4", 4.5, 0], [38, "5", 5.5, 0],
	[78, "6", 6.5, 0], [76, "7", 7.5, 0], [27, "8", 8.5, 0], [67, "9", 9.5, 0], [65, "0", 10.5, 0], [5, "-", 11.5, 0],
	[28, "=", 12.5, 0], [8, "Backspace", 14.0, 0], [70, "Insert", 15.5, 0],

	[66, "Tab", 0.75, 1], [4, "Q", 2.0, 1], [83, "W", 3.0, 1], [0, "E", 4.0, 1], [40, "R", 5.0, 1], [18, "T", 6.0, 1],
	[16, "Y", 7.0, 1], [47, "U", 8.0, 1], [7, "I", 9.0, 1], [25, "O", 10.0, 1], [45, "P", 11.0, 1], [68, "[", 12.0, 1],
	[48, "]", 13.0, 1], [30, "\\", 14.25, 1], [10, "Del", 15.5, 1],

	[46, "Caps Lock", 0.875, 2], [81, "A", 2.25, 2], [80, "S", 3.25, 2], [82, "D", 4.25, 2], [58, "F", 5.25, 2],
	[36, "G", 6.25, 2], [56, "H", 7.25, 2], [3, "J", 8.25, 2], [41, "K", 9.25, 2], [12, "L", 10.25, 2],
	[52, ";", 11.25, 2], [72, "'", 12.25, 2], [34, "Enter", 13.875, 2], [50, "Page Up", 15.5, 2],

	[6, "Left Shift", 1.125, 3], [44, "Z", 2.75, 3], [49, "X", 3.75, 3], [29, "C", 4.75, 3], [9, "V", 5.75, 3],
	[69, "B", 6.75, 3], [43, "N", 7.75, 3], [23, "M", 8.75, 3], [21, ",", 9.75, 3], [1, ".", 10.75, 3],
	[32, "/", 11.75, 3], [54, "Right Shift", 13.125, 3], [53, "Up Arrow", 14.5, 3], [55, "Page Down", 15.5, 3],

	[11, "Left Ctrl", 0.625, 4], [71, "Left Win", 1.875, 4], [31, "Left Alt", 3.125, 4], [63, "Space", 6.875, 4],
	[61, "Right Alt", 10.5, 4], [14, "Fn", 11.5, 4], [74, "Right Ctrl", 12.5, 4], [33, "Left Arrow", 13.5, 4],
	[73, "Down Arrow", 14.5, 4], [13, "Right Arrow", 15.5, 4],
];

// Convert the key center (key units) to a grid cell (0.25 u per cell), clamped to the grid.
// Esc (center 0.5 u) lands on cell 0 and Insert (center 15.5 u) on cell 60.
const vKeys = vKeyUnits.map(k => [
	k[0],
	k[1],
	Math.max(0, Math.min(GRID_W - 1, Math.round(k[2] * 4 - 2))),
	Math.max(0, Math.min(GRID_H - 1, k[3] * 4)),
]);

const vLedNames = vKeys.map(k => k[1]);
const vLedPositions = vKeys.map(k => [k[2], k[3]]);

export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }

const LED_COUNT = 128;
const BLOCK_OFFSETS = [0x00, 0x38, 0x70, 0xA8, 0xE0, 0x118, 0x148];

// The configuration interface is the one the vendor web driver opens (USB interface 1).
export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function Initialize() {
	device.setName("Mchose Ace 68");
	device.setSize([GRID_W, GRID_H]);
	device.setControllableLeds(vLedNames, vLedPositions);
	device.log("Mchose Ace 68 initialized");
}

export function Render() {
	frameCount++;
	if (frameCount === 1 || frameCount % 1800 === 0) {
		device.log("frame " + frameCount + " | mode=" + LightingMode +
			" | ACK ok=" + ackOk + " failed=" + ackFail + " readBroken=" + readBroken);
	}

	const colors = new Array(LED_COUNT).fill(null);
	const forced = hexToRgb(forcedColor);

	for (const k of vKeys) {
		if (LightingMode === "Forced") {
			colors[k[0]] = forced;
		} else {
			colors[k[0]] = device.color(k[2], k[3]);
		}
	}

	sendFrame(colors);
	device.pause(1);
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? [0, 0, 0] : hexToRgb(shutdownColor);
	const colors = new Array(LED_COUNT).fill(null);
	for (const k of vKeys) { colors[k[0]] = color; }

	forceFull = true;
	sendFrame(colors);
}

// Accepts "#RRGGBB" or "RRGGBB".
function hexToRgb(hex) {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex));
	if (!m) { return [255, 255, 255]; }
	return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

let lastBlocks = {};
let forceFull = true;
let readBroken = false; // becomes true if device.read throws; then only fixed pauses are used
let ackOk = 0, ackFail = 0, frameCount = 0;

// colors: LED_COUNT entries of [r, g, b] (or null), indexed by the hardware LED index.
function sendFrame(colors) {
	const buf = new Array(0x180 + 0x38).fill(0);
	for (let i = 0; i < LED_COUNT; i++) {
		const c = colors[i];
		if (!c) { continue; }
		buf[i * 3] = c[0];
		buf[i * 3 + 1] = c[1];
		buf[i * 3 + 2] = c[2];
	}

	for (const off of BLOCK_OFFSETS) {
		const pkt = new Array(64).fill(0);
		pkt[0] = 0x55;
		pkt[1] = 0x0B;
		pkt[2] = 0x00;
		pkt[4] = 0x38;
		pkt[5] = off & 0xFF;
		pkt[6] = (off >> 8) & 0xFF;
		pkt[7] = 0x00;
		for (let i = 0; i < 56; i++) { pkt[8 + i] = buf[off + i]; }

		let sum = 0;
		for (let i = 4; i < 64; i++) { sum += pkt[i]; }
		pkt[3] = sum & 0xFF;

		// Only resend blocks that changed (less traffic = fewer dropped blocks), plus a full
		// refresh about every 2 seconds to repair any block the keyboard may have missed.
		const sig = pkt.slice(8).join(",");
		const refresh = forceFull || (frameCount % 120 === 0);
		if (!refresh && lastBlocks[off] === sig) { continue; }

		const ok = writeBlockWithAck(pkt, off);
		lastBlocks[off] = ok ? sig : null; // if it failed, try again on the next frame
	}
	forceFull = false;
}

// data: input report from device.read. Some hosts keep the report ID (0x00) as the first byte.
function isAck(data, off) {
	if (!data || data.length < 7) { return false; }
	const s = (data[0] === 0xAA) ? 0 : ((data[0] === 0x00 && data[1] === 0xAA) ? 1 : -1);
	if (s < 0) { return false; }
	return data[s + 1] === 0x0B && data[s + 5] === (off & 0xFF) && data[s + 6] === ((off >> 8) & 0xFF);
}

function clearPendingReports() {
	if (typeof device.clearReadBuffer === "function") {
		device.clearReadBuffer();
		return;
	}
	for (let i = 0; i < 4; i++) {
		const old = device.read([0x00], 65, 1);
		if (!old || old.length === 0) { break; }
	}
}

function writeBlockWithAck(pkt, off) {
	for (let attempt = 0; attempt < 3; attempt++) {
		// Drop stale reports so the ACK of a previous block is not mistaken for this one.
		if (!readBroken) {
			try { clearPendingReports(); } catch (e) { readBroken = true; }
		}

		// Leading 0x00 = report ID 0, total length 65 (the endpoint has no report ID).
		device.write([0x00].concat(pkt), 65);

		if (readBroken) { device.pause(12); return false; }

		// Read up to 4 reports (the keyboard also sends "55 0b ..." echoes) looking for the ACK.
		try {
			for (let i = 0; i < 4; i++) {
				const resp = device.read([0x00], 65, 15);
				if (isAck(resp, off)) { ackOk++; return true; }
				if (!resp || resp.length === 0) { break; }
			}
		} catch (e) {
			readBroken = true;
			device.log("device.read failed, falling back to fixed pauses: " + e);
			device.pause(12);
			return false;
		}
	}
	ackFail++;
	return false;
}

export function ImageUrl() {
	return "";
}
