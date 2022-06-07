export interface Squawk extends Error {
	code: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	meta?: Record<string, any> | undefined;
	reasons?: Squawk[] | undefined;
}
