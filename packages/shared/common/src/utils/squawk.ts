type Meta = Record<string, any>;

interface PossibleSquawk {
	code: string;
	reasons?: Squawk[];
	meta?: Meta;
}

export default class Squawk extends Error {
	readonly code: string = '';
	readonly meta: Meta | undefined = void 0;
	readonly reasons: Squawk[] | undefined = void 0;

	constructor(code: string, meta?: Meta | null, reasons?: Error[]) {
		super(code);

		this.code = code;

		if (meta)
			this.meta = meta;

		if (reasons) {
			this.reasons = [];

			for (const i in reasons) {
				if (!Squawk.isSquawk(reasons[i]))
					this.reasons.push(Squawk.coerce(reasons[i]));
			}
		}

		defineNonSerializable(this, 'name', 'Squawk');
		defineNonSerializable(this, 'message', this.code);
	}

	static isSquawk(error: Error) {
		return (error instanceof Squawk);
	}

	static coerce(error: unknown) {
		if (error instanceof Error && Squawk.isSquawk(error))
			return error as Squawk;

		const possibleSquawk = error as PossibleSquawk;

		let newError: Squawk;

		if (error && typeof possibleSquawk.code === 'string')
			newError = new Squawk(possibleSquawk.code, possibleSquawk.meta, possibleSquawk.reasons);
		else if (error instanceof Error)
			newError = new Squawk('unknown', error.message ? { message: error.message } : void 0);
		else
			newError = new Squawk('unknown', error ? { error } : void 0);

		if (error instanceof Error)
			defineNonSerializable(newError, 'stack', error.stack);

		return newError;
	}
}

function defineNonSerializable(obj: unknown, property: string, value: unknown) {
	Object.defineProperty(obj, property, {
		value,
		writable: false,
		enumerable: false, // prevents json serialization
		configurable: true, // allows redefinition
	});
}
