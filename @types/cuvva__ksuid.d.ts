// Type definitions for @cuvva/ksuid 0.0.0
// Definitions by: Salvo <https://github.com/salvocanna>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.4

declare module '@cuvva/ksuid' {
	export interface Ksuid {
		environment: string;
		resource: string;
		timestamp: number;
		instance: string;
		sequenceId: number;

		toString: () => string;
	}

	export function parse(input: string): Ksuid;
	export function generate(resource: string): Ksuid;

	let environment: string;
	let instance: string;

	export class Id {
		constructor(environment: string, resource: string, timestamp: number, instance: string, sequenceId: number);

		toString(): string;
		static parse(input: string): Id;
	}

	export class Node {
		constructor(environment: string, instance?: any);

		environment: string;
		instance: Node;

		generate(resource: string): Ksuid;
	}

	export class Instance {
		constructor(scheme: string, identifier: string);

		toBuffer(): string;

		static fromBuffer(buffer: string): Instance;
	}
}

