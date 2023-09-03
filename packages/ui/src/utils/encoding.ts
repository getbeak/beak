const byteToHex = new Array(0xff);

(function init() {
	for (let i = 0; i <= 0xff; ++i) {
		const hexOctet = i.toString(16).padStart(2, '0');

		byteToHex[i] = hexOctet;
	}
}());

export function arrayBufferToHexString(arrayBuffer: ArrayBuffer) {
	const buff = new Uint8Array(arrayBuffer);
	const hexOctets = new Array(buff.length);

	for (let i = 0; i < buff.length; ++i)
		hexOctets[i] = byteToHex[buff[i]];

	return hexOctets.join('');
}
