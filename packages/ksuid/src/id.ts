import Instance from './instance';
import base62 from './base62';
import { decodedLen, encodedLen, ksuidRegex } from './constants';
import { checkPrefix, checkUint } from './validation';

export default class Id {
	readonly environment: string;
	readonly resource: string;
	readonly timestamp: number;
	readonly instance: Instance;
	readonly sequenceId: number;

	constructor(
		environment: string,
		resource: string,
		timestamp: number,
		instance: Instance,
		sequenceId: number,
	) {
		checkPrefix('environment', environment);
		checkPrefix('resource', resource);
		checkUint('timestamp', timestamp, 8);
		checkUint('sequenceId', sequenceId, 4);

		this.environment = environment;
		this.resource = resource;
		this.timestamp = timestamp;
		this.instance = instance;
		this.sequenceId = sequenceId;
	}

	toString(): string {
		const env = this.environment === 'prod' ? '' : `${this.environment}_`;
		const prefix = `${env}${this.resource}_`;

		const decoded = new Uint8Array(decodedLen);
		const dataView = new DataView(decoded.buffer);

		// JS can't yet store 64-bit numbers accurately
		// for now, we're just writing the lower 48 bits
		// this will become a problem at 8921556-12-07T10:44:16Z
		setUint48BE(dataView, 2, this.timestamp);
		decoded.set(this.instance.toBuffer(), 8);
		dataView.setUint32(17, this.sequenceId);

		const encoded = base62.encode(decoded).padStart(encodedLen, '0');

		return prefix + encoded;
	}

	static parse(input: string): Id {
		if (!input.length) {
			throw new Error('input must not be empty');
		}

		const { environment, resource, encoded } = splitPrefixId(input);

		const decoded = base62.decode(encoded).slice(-decodedLen);
		const dataView = new DataView(decoded.buffer);

		if (dataView.getUint16(0) !== 0) {
			throw new Error('timestamp greater than 8921556-12-07T10:44:16Z');
		}

		return new Id(
			environment,
			resource,
			getUint48BE(dataView, 2),
			Instance.fromBuffer(decoded.slice(8, 17)),
			dataView.getUint32(17),
		);
	}
}

function splitPrefixId(input: string) {
	const parsed = ksuidRegex.exec(input);

	if (!parsed) {
		throw new Error('id is invalid');
	}

	const [, environment, resource, encoded] = parsed;

	if (environment === 'prod') {
		throw new Error('production env is implied');
	}

	return {
		environment: environment || 'prod',
		resource,
		encoded,
	};
}

function getUint48BE(view: DataView, offset: number): number {
	const upper = view.getUint16(offset);
	const lower = view.getUint32(offset + 2);

	return upper * 2 ** 32 + lower;
}

function setUint48BE(view: DataView, offset: number, value: number) {
	// eslint-disable-next-line no-bitwise
	const lower = value & (2 ** 32 - 1);
	const upper = (value - lower) / 2 ** 32;

	view.setUint16(offset, upper);
	view.setUint32(offset + 2, lower);
}
