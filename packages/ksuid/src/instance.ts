import { checkUint, checkUint8Array } from './validation';

export default class Instance {
	static schemes = {
		RANDOM: 82, // R
		MAC_AND_PID: 72, // H
		DOCKER_CONT: 68, // D
	};

	readonly scheme: number;
	readonly identifier: Uint8Array;

	constructor(scheme: number, identifier: Uint8Array) {
		checkUint('scheme', scheme, 1);
		checkUint8Array('identifier', identifier, 8);

		this.scheme = scheme;
		this.identifier = identifier;
	}

	toBuffer(): Uint8Array {
		const buffer = new Uint8Array(9);

		buffer[0] = this.scheme;
		buffer.set(this.identifier, 1);

		return buffer;
	}

	static fromBuffer(buffer: Uint8Array): Instance {
		checkUint8Array('buffer', buffer, 9);

		return new Instance(buffer[0], buffer.slice(1));
	}
}
