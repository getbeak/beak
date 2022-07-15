import Squawk from '@beak/squawk';
import fetchPonyfill from 'fetch-ponyfill';

const { fetch } = fetchPonyfill();

interface BackendErrorMetadata {
	reasons?: Squawk[];
	meta?: Record<string, unknown>;
	traceId?: string;
	requestMethod: string;
	requestUrl: string;
	responseStatusCode: number;
	responseBody?: string;
	responseData?: unknown;
}

export class BackendError extends Squawk {
	traceId?: string;
	requestMethod: string;
	requestUrl: string;
	responseStatusCode: number;
	responseBody?: string;
	responseData?: unknown;

	constructor(code: string, metadata: BackendErrorMetadata) {
		const { reasons, meta, ...fields } = metadata;

		super(code, meta, reasons);

		this.traceId = fields.traceId;
		this.requestMethod = fields.requestMethod;
		this.requestUrl = fields.requestUrl;
		this.responseStatusCode = fields.responseStatusCode;
		this.responseBody = fields.responseBody;
		this.responseData = fields.responseData;
	}
}

export interface RequestOptions extends RequestInit {
	headers?: Record<string, string>;
	timeout?: number;
}

const defaultOptions: RequestOptions = {
	headers: { accept: 'application/json' },
};

export default function jsonClient(baseUrl: string, baseOptions?: RequestOptions) {
	const safeBaseUrl = baseUrl.replace(/\/*$/, '/');
	const safeBaseOptions = mergeOptions(defaultOptions, baseOptions);

	return async <ResT>(
		method: string,
		path: string,
		urlParams?: Record<string, unknown>,
		body?: unknown,
		options?: RequestOptions,
	): Promise<ResT> => {
		const safePath = path.replace(/^\/*/, '');
		const safeOptions = mergeOptions(safeBaseOptions, options);

		const search = new URLSearchParams(urlParams as Record<string, string>);
		const query = urlParams ? `?${search.toString()}` : '';
		const url = safeBaseUrl + safePath + query;

		return await makeRequest<ResT>(method, url, body, safeOptions);
	};
}

async function makeRequest<ResT>(
	requestMethod: string,
	requestUrl: string,
	requestBody: unknown | undefined,
	options: RequestOptions,
): Promise<ResT> {
	let req: RequestInit = { method: requestMethod };

	if (requestBody != null) {
		req.body = JSON.stringify(requestBody);
		req.headers = { 'content-type': 'application/json' };
	}

	req = mergeOptions(options, req);

	let controller: AbortController;
	let timeoutId: NodeJS.Timeout | undefined = void 0;

	if (options.timeout !== void 0) {
		controller = new AbortController();
		timeoutId = setTimeout(() => controller.abort(), options.timeout);
		req.signal = controller.signal;
	}

	const response = await fetch(requestUrl, req).finally(() => {
		if (timeoutId) clearTimeout(timeoutId);
	});

	const responseBody = await response.text();

	const errorFields = {
		traceId: response.headers.get('request-id') ?? void 0,
		requestMethod,
		requestUrl,
		responseStatusCode: response.status,
		responseBody,
		responseData: void 0 as unknown,
	};

	// 2xx - success
	if (response.ok) {
		if (!responseBody)
			return void 0 as unknown as ResT;

		try {
			return JSON.parse(responseBody);
		} catch (e) {
			throw new BackendError('invalid_json_response', errorFields);
		}
	}

	// any non-success codes
	// includes 4xx, 5xx and some 3xx codes
	let parsedBody: unknown;

	try {
		parsedBody = errorFields.responseData = JSON.parse(responseBody);
	} catch { /* */ }

	let cher: Squawk | undefined;

	if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
		try {
			cher = Squawk.coerce(parsedBody as Record<string, unknown>);
		} catch { /* */ }
	}

	if (!cher) {
		throw new BackendError(
			response.statusText.toLowerCase().replace(/\s+/g, '_'),
			errorFields,
		);
	}

	throw new BackendError(cher.code, {
		reasons: cher.reasons,
		meta: cher.meta,
		...errorFields,
	});
}

function mergeOptions<T extends RequestOptions | RequestInit>(baseOptions: T, newOptions?: T | RequestInit): T {
	const safeNewOptions = newOptions ?? ({} as T);

	return {
		...baseOptions,
		...safeNewOptions,
		headers: {
			...baseOptions.headers,
			...safeNewOptions.headers,
		},
	};
}

export type Client = ReturnType<typeof makeRequest>;
