/**
 * Parse a user-supplied gRPC endpoint string into the `host:port` form
 * `@grpc/grpc-js` wants, plus a hint about whether to use TLS.
 *
 * Conventions:
 *   - Explicit `grpcs://` / `https://` → TLS.
 *   - Explicit `grpc://` / `http://`  → insecure.
 *   - localhost / 127.0.0.1 (any port) → insecure unless explicit TLS scheme.
 *   - Port 443 with no scheme           → TLS (the public-internet default).
 *   - Anything else                     → TLS (safe default; user can prefix
 *     `grpc://` to opt out if their server expects plaintext).
 *
 * The defaults match what `grpcurl --plaintext` does for localhost and
 * what `evans` does for the public internet.
 */
export interface ParsedEndpoint {
	address: string;
	useTls: boolean;
}

export function parseGrpcEndpoint(input: string): ParsedEndpoint {
	const trimmed = input.trim();
	if (trimmed.length === 0) throw new Error('gRPC endpoint is empty');

	let useTls: boolean | null = null;
	let body = trimmed;
	if (/^grpcs:\/\//i.test(body)) {
		useTls = true;
		body = body.slice('grpcs://'.length);
	} else if (/^https:\/\//i.test(body)) {
		useTls = true;
		body = body.slice('https://'.length);
	} else if (/^grpc:\/\//i.test(body)) {
		useTls = false;
		body = body.slice('grpc://'.length);
	} else if (/^http:\/\//i.test(body)) {
		useTls = false;
		body = body.slice('http://'.length);
	}

	body = body.replace(/\/+$/, '');
	if (body.length === 0) throw new Error('gRPC endpoint has no host');

	const portMatch = body.match(/:(\d+)$/);
	const port = portMatch ? Number(portMatch[1]) : null;
	const host = portMatch ? body.slice(0, body.length - portMatch[0].length) : body;
	if (host.length === 0) throw new Error('gRPC endpoint missing host before port');

	const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
	if (useTls === null) {
		if (isLocal) useTls = false;
		else if (port === 443 || port === null) useTls = true;
		else useTls = true;
	}

	const resolvedPort = port ?? (useTls ? 443 : 80);
	return { address: `${host}:${resolvedPort}`, useTls };
}
