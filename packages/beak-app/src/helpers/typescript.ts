export type GenericObject = Record<string, unknown>;

function typedObjectKeys<T extends GenericObject>(inputObject: T) {
	return Object.keys(inputObject) as (keyof typeof inputObject)[];
}

function typedObjectValues<T extends GenericObject>(inputObject: T) {
	return Object.values(inputObject) as (T[keyof T])[];
}

export const TypedObject = {
	keys: typedObjectKeys,
	values: typedObjectValues,
};
