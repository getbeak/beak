export type AsyncState<T> = T extends void ? {
	fetching: boolean;
	response: void;
	error: Error;
} : {
	fetching: boolean;
	response: T;
	error: Error;
};

export interface AsyncMapState<T> {
	[key: string]: AsyncState<T>;
}

export type RequestIdPayload<T> = { requestId: string } & T;
