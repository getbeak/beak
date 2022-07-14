import jsonClient, { RequestOptions } from '@beak/json-client';

import { desnek, snek } from './casing';

const crpc = (baseUrl: string, baseOptions?: RequestOptions) => {
	const client = jsonClient(baseUrl, baseOptions);

	return async function crpcRequest<TRes>(
		path: string,
		body: unknown,
		options?: RequestOptions,
	): Promise<TRes> {
		const transformedBody = snek(body);
		const response = await client('post', path, void 0, transformedBody, options);

		return desnek(response) as TRes;
	};
};

export type Client = ReturnType<typeof crpc>;
export default crpc;
export { snek, desnek };
