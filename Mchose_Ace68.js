// SignalRGB plugin - Mchose Ace 68 (VID 0x3837 / PID 0x3003, "Ace 68 -III")
// Protocolo obtido por captura WebHID do app M HUB (mchose.com.cn).
//
// Pacote de 64 bytes, report ID 0:
//   55 0b 00 <checksum> 38 <off_lo> <off_hi> 00 <56 bytes de dados>
//   checksum = soma dos bytes [4..63] & 0xFF
// Dados = 128 LEDs x 3 bytes (R,G,B) = 384 bytes, enviados em 7 blocos
// nos offsets 0x00,0x38,0x70,0xA8,0xE0,0x118,0x148 (o ultimo se sobrepoe).

export function Name() { return "Mchose Ace 68"; }
export function VendorId() { return 0x3837; }
export function ProductId() { return 0x3003; }
export function Publisher() { return "Comunidade"; }
export function Documentation() { return "troubleshooting/mchose"; }
export function DeviceType() { return "Keyboard"; }
// Grade de 0,25 unidade de tecla por celula: 16 u de largura -> 61 celulas (indices 0..60)
// e 5 fileiras -> 17 celulas (indices 0,4,8,12,16), mantendo as proporcoes do teclado fisico.
const GRID_W = 61;
const GRID_H = 17;
export function Size() { return [GRID_W, GRID_H]; }
export function DefaultPosition() { return [10, 100]; }
export function DefaultScale() { return 2.0; }
export function ControllableParameters() {
	return [
		{ property: "shutdownColor", group: "lighting", label: "Cor ao desligar", type: "color", default: "#000000" },
		{ property: "LightingMode", group: "lighting", label: "Modo", type: "combobox", values: ["Canvas", "Forced"], default: "Canvas" },
		{ property: "forcedColor", group: "lighting", label: "Cor forcada", type: "color", default: "#009bde" },
	];
}

// [indice do LED no pacote, nome, centro da tecla em unidades de tecla (1u = tecla padrao), fileira]
// Larguras reais: Backspace 2u, Tab 1.5u, \ 1.5u, Caps 1.75u, Enter 2.25u,
// Shift esq. 2.25u, Shift dir. 1.75u, Ctrl/Win/Alt esq. 1.25u, Space 6.25u.
const vKeyUnits = [
	[26, "Esc", 0.5, 0], [64, "1", 1.5, 0], [22, "2", 2.5, 0], [2, "3", 3.5, 0], [60, "4", 4.5, 0], [38, "5", 5.5, 0],
	[78, "6", 6.5, 0], [76, "7", 7.5, 0], [27, "8", 8.5, 0], [67, "9", 9.5, 0], [65, "0", 10.5, 0], [5, "-", 11.5, 0],
	[28, "=", 12.5, 0], [8, "Backspace", 14.0, 0], [70, "Insert", 15.5, 0],

	[66, "Tab", 0.75, 1], [4, "Q", 2.0, 1], [83, "W", 3.0, 1], [0, "E", 4.0, 1], [40, "R", 5.0, 1], [18, "T", 6.0, 1],
	[16, "Y", 7.0, 1], [47, "U", 8.0, 1], [7, "I", 9.0, 1], [25, "O", 10.0, 1], [45, "P", 11.0, 1], [68, "[", 12.0, 1],
	[48, "]", 13.0, 1], [30, "\\", 14.25, 1], [10, "Delete", 15.5, 1],

	[46, "Caps Lock", 0.875, 2], [81, "A", 2.25, 2], [80, "S", 3.25, 2], [82, "D", 4.25, 2], [58, "F", 5.25, 2],
	[36, "G", 6.25, 2], [56, "H", 7.25, 2], [3, "J", 8.25, 2], [41, "K", 9.25, 2], [12, "L", 10.25, 2],
	[52, ";", 11.25, 2], [72, "'", 12.25, 2], [34, "Enter", 13.875, 2], [50, "Page Up", 15.5, 2],

	[6, "Left Shift", 1.125, 3], [44, "Z", 2.75, 3], [49, "X", 3.75, 3], [29, "C", 4.75, 3], [9, "V", 5.75, 3],
	[69, "B", 6.75, 3], [43, "N", 7.75, 3], [23, "M", 8.75, 3], [21, ",", 9.75, 3], [1, ".", 10.75, 3],
	[32, "/", 11.75, 3], [54, "Right Shift", 13.125, 3], [53, "Up Arrow", 14.5, 3], [55, "Page Down", 15.5, 3],

	[11, "Left Ctrl", 0.625, 4], [71, "Left Win", 1.875, 4], [31, "Left Alt", 3.125, 4], [63, "Space", 6.875, 4],
	[61, "Right Alt", 10.5, 4], [14, "FN", 11.5, 4], [74, "Right Ctrl", 12.5, 4], [33, "Left Arrow", 13.5, 4],
	[73, "Down Arrow", 14.5, 4], [13, "Right Arrow", 15.5, 4],
];

// converte o centro em unidades para a celula da grade (0,25 u por celula) e limita ao tamanho da grade.
// A Esc (centro 0,5 u) fica na celula 0 e o Insert (centro 15,5 u) na celula 60.
const vKeys = vKeyUnits.map(k => [
	k[0],
	k[1],
	Math.max(0, Math.min(GRID_W - 1, Math.round(k[2] * 4 - 2))),
	Math.max(0, Math.min(GRID_H - 1, k[3] * 4)),
]);

const vLedNames = vKeys.map(k => k[1]);
const vLedPositions = vKeys.map(k => [k[2], k[3]]);

const LED_COUNT = 128;
const BLOCK_OFFSETS = [0x00, 0x38, 0x70, 0xA8, 0xE0, 0x118, 0x148];

export function LedNames() { return vLedNames; }
export function LedPositions() { return vLedPositions; }

// A interface de configuracao (a mesma que o WebHID abre) deve ser confirmada
// na aba do dispositivo no SignalRGB. Ajuste aqui se necessario.
export function Validate(endpoint) {
	return endpoint.interface === 1;
}

export function Initialize() {
	device.setName("Mchose Ace 68");
	device.setSize([GRID_W, GRID_H]);
	device.setControllableLeds(vLedNames, vLedPositions);
	device.log("Mchose Ace 68 inicializado");
}

// aceita "#RRGGBB" ou "RRGGBB" (o SignalRGB pode mandar das duas formas)
function hexToRgb(hex) {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex));
	if (!m) { return [255, 255, 255]; }
	return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function sendFrame(colors) {
	// colors: array de LED_COUNT entradas [r,g,b], indexadas pelo indice do LED do hardware
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

		// So reenvia blocos que mudaram (menos trafego = menos perda), mais um refresh
		// completo a cada ~2 s para corrigir qualquer bloco que o teclado tenha perdido.
		const sig = pkt.slice(8).join(",");
		const refresh = forceFull || (frameCount % 120 === 0);
		if (!refresh && lastBlocks[off] === sig) { continue; }

		const ok = writeBlockWithAck(pkt, off);
		lastBlocks[off] = ok ? sig : null; // se falhou, tenta de novo no proximo frame
	}
	forceFull = false;
}

let lastBlocks = {};
let forceFull = true;

// O teclado responde a cada bloco com um input report "aa 0b 00 <cs> 38 <off_lo> <off_hi> ...".
// Sem esperar esse ACK ele descarta blocos (nos testes, so parte das teclas mudava).
function isAck(data, off) {
	if (!data || data.length < 7) { return false; }
	// alguns hosts incluem o report ID (0x00) na frente
	const s = (data[0] === 0xAA) ? 0 : ((data[0] === 0x00 && data[1] === 0xAA) ? 1 : -1);
	if (s < 0) { return false; }
	return data[s + 1] === 0x0B && data[s + 5] === (off & 0xFF) && data[s + 6] === ((off >> 8) & 0xFF);
}

let readBroken = false; // vira true se device.read falhar; ai usamos so pausas
let ackOk = 0, ackFail = 0, frameCount = 0;

function writeBlockWithAck(pkt, off) {
	for (let attempt = 0; attempt < 3; attempt++) {
		// descarta respostas antigas, para nao confundir o ACK deste bloco com o de outro
		if (!readBroken) {
			try { for (let d = 0; d < 4; d++) { const old = device.read([0x00], 65, 1); if (!old || old.length === 0) { break; } } }
			catch (e) { readBroken = true; }
		}

		// report ID 0 na frente + 64 bytes de dados
		device.write([0x00].concat(pkt), 65);

		if (readBroken) { device.pause(12); return false; }

		// le ate 4 reports (o teclado tambem manda ecos "55 0b ...") procurando o ACK
		try {
			for (let i = 0; i < 4; i++) {
				const resp = device.read([0x00], 65, 15);
				if (isAck(resp, off)) { ackOk++; return true; }
				if (!resp || resp.length === 0) { break; }
			}
		} catch (e) {
			readBroken = true;
			device.log("device.read falhou, usando apenas pausas: " + e);
			device.pause(12);
			return false;
		}
	}
	ackFail++;
	return false;
}

export function Render() {
	frameCount++;
	if (frameCount === 1 || frameCount % 300 === 0) {
		device.log("frame " + frameCount + " | modo=" + LightingMode + " | forcedColor=" + forcedColor +
			" | ACK ok=" + ackOk + " falhas=" + ackFail + " readBroken=" + readBroken);
	}

	const colors = new Array(LED_COUNT).fill(null);
	const forced = hexToRgb(forcedColor);

	for (const k of vKeys) {
		const idx = k[0];
		if (LightingMode === "Forced") {
			colors[idx] = forced;
		} else {
			colors[idx] = device.color(k[2], k[3]);
		}
	}
	sendFrame(colors);
}

export function Shutdown() {
	const c = hexToRgb(shutdownColor);
	const colors = new Array(LED_COUNT).fill(null);
	for (const k of vKeys) { colors[k[0]] = c; }
	forceFull = true;
	sendFrame(colors);
}

export function Image() { return ""; }
