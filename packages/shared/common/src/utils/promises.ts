type Executor<T> = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;
type Status = 'pending' | 'resolved' | 'rejected';

export default class QueryablePromise<T> extends Promise<T> {
	private internalStatus: Status = 'pending';

	constructor(executor: Executor<T>) {
		super((resolve, reject) => executor(
			response => {
				resolve(response);

				this.internalStatus = 'resolved';
			},
			error => {
				reject(error);

				this.internalStatus = 'rejected';
			},
		));

		this.internalStatus = 'pending';
	}

	get status() {
		return this.internalStatus;
	}
}
