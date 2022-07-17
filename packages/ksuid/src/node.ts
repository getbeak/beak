import Id from './id';
import Instance from './instance';
import { checkPrefix } from './validation';
import { getRandomBytes } from './random';

export default class Node {
	private _environment: string;
	private _instance: Instance;
	private _lastTimestamp: number;
	private _currentSequence: number;

	constructor(
		environment: string = 'prod',
		instance: Instance = getInstance(),
	) {
		checkPrefix('environment', environment);

		this._environment = environment;
		this._instance = instance;
		this._lastTimestamp = 0;
		this._currentSequence = 0;
	}

	get environment(): string {
		return this._environment;
	}

	set environment(value: string) {
		checkPrefix('environment', value);

		this._environment = value;
	}

	get instance(): Instance {
		return this._instance;
	}

	set instance(value: Instance) {
		this._instance = value;
	}

	generate(resource: string): Id {
		const now = Math.floor(Date.now() / 1000);

		if (this._lastTimestamp === now) {
			this._currentSequence += 1;
		} else {
			this._lastTimestamp = now;
			this._currentSequence = 0;
		}

		return new Id(
			this.environment,
			resource,
			this._lastTimestamp,
			this.instance,
			this._currentSequence,
		);
	}
}

function getInstance(): Instance {
	return new Instance(Instance.schemes.RANDOM, getRandomBytes(8));
}
