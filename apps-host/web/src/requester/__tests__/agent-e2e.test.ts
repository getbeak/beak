import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { AGENT_HEALTHZ_PATH, AGENT_PAIR_PATH, AGENT_PAIR_TOKEN_PATH } from '@beak/common/wire/agent';
import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '@beak/common/types/requester';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createAgentRequester } from '../agent';

// End-to-end smoke test: builds the Go agent, spawns it with --no-tray,
// drives the PKCE pairing handshake, and runs a flight through the real
// adapter. Proves the entire wire contract — including the SSE envelope
// shape (caught a real bug during initial author of this test).
//
// Slow-ish: builds the binary on first run, holds two processes. Marked
// `.concurrent = false` implicitly by not opting in. Skip when the test
// runner lacks Go.

const repoRoot = resolve(__dirname, '../../../../..');
const agentDir = join(repoRoot, 'apps-host/agent');
const binaryPath = join(agentDir, 'beak-agent-test');

function hasGo(): boolean {
	const result = spawnSync('go', ['version'], { stdio: 'ignore' });
	return result.status === 0;
}

async function pollHealthz(baseUrl: string, timeoutMs: number) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const resp = await fetch(`${baseUrl}${AGENT_HEALTHZ_PATH}`);
			if (resp.ok) return;
			resp.body?.cancel();
		} catch {
			// not up yet
		}
		await new Promise(r => setTimeout(r, 50));
	}
	throw new Error(`agent at ${baseUrl} did not become healthy within ${timeoutMs}ms`);
}

// The agent's first line of stdout is `[beak-agent] listening on http://127.0.0.1:<port>`.
// Parsing it (rather than scanning the port range) avoids picking up any
// other agent the user already has running and pins the test to the exact
// process we spawned.
function waitForListenLine(proc: ChildProcess, timeoutMs: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error(`agent never logged a listen line within ${timeoutMs}ms`)),
			timeoutMs,
		);
		let buffer = '';
		const onData = (chunk: Buffer | string) => {
			buffer += chunk.toString();
			const match = buffer.match(/listening on (http:\/\/127\.0\.0\.1:\d+)/);
			if (match) {
				clearTimeout(timer);
				proc.stdout?.off('data', onData);
				resolve(match[1]);
			}
		};
		proc.stdout?.on('data', onData);
	});
}

const skip = !hasGo();
const description = skip ? describe.skip : describe;

description('agent end-to-end (real binary)', () => {
	let proc: ChildProcess;
	let baseUrl: string;
	let configDir: string;

	beforeAll(async () => {
		// Build the binary (idempotent; Go's build cache makes this fast).
		const build = spawnSync('go', ['build', '-o', binaryPath, './cmd/beak-agent'], {
			cwd: agentDir,
			stdio: 'inherit',
		});
		if (build.status !== 0) throw new Error('go build failed');

		// Sandbox the agent's filesystem so it doesn't touch the real
		// ~/Library/Application Support/beak-agent.
		configDir = mkdtempSync(join(tmpdir(), 'beak-agent-e2e-'));

		proc = spawn(binaryPath, ['-no-tray'], {
			env: {
				...process.env,
				// macOS: os.UserConfigDir reads HOME → Library/Application Support
				// Linux: XDG_CONFIG_HOME / XDG_RUNTIME_DIR
				HOME: configDir,
				// biome-ignore lint/style/useNamingConvention: env var names.
				XDG_CONFIG_HOME: configDir,
				// biome-ignore lint/style/useNamingConvention: env var names.
				XDG_RUNTIME_DIR: configDir,
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		proc.stderr?.on('data', chunk => process.stderr.write(`[agent] ${chunk}`));

		baseUrl = await waitForListenLine(proc, 5_000);
		await pollHealthz(baseUrl, 2_000);
	}, 30_000);

	afterAll(async () => {
		if (proc && !proc.killed) {
			proc.kill('SIGTERM');
			await new Promise(r => setTimeout(r, 100));
			if (!proc.killed) proc.kill('SIGKILL');
		}
		try {
			rmSync(configDir, { recursive: true, force: true });
		} catch {
			// best-effort
		}
	});

	async function pairWithAgent(origin: string): Promise<string> {
		// PKCE setup
		const verifierBytes = new Uint8Array(32);
		crypto.getRandomValues(verifierBytes);
		const verifier = base64UrlNoPad(verifierBytes);
		const challenge = base64UrlNoPad(
			new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
		);
		const state = `state-${Date.now()}`;
		const returnUrl = `${origin}/agent/pair/return`;

		// 1. GET /pair to stash the pending init
		const pairUrl =
			`${baseUrl}${AGENT_PAIR_PATH}?origin=${encodeURIComponent(origin)}` +
			`&state=${encodeURIComponent(state)}` +
			`&code_challenge=${encodeURIComponent(challenge)}` +
			'&code_challenge_method=S256' +
			`&return=${encodeURIComponent(returnUrl)}`;
		const pairResp = await fetch(pairUrl, { headers: { 'Origin': origin } });
		expect(pairResp.status).toBe(200);
		await pairResp.body?.cancel();

		// 2. POST /pair/decision allow → follows the redirect manually so
		// we can read the ?code query parameter back out
		const decisionResp = await fetch(`${baseUrl}${AGENT_PAIR_PATH}/decision?state=${encodeURIComponent(state)}`, {
			method: 'POST',
			redirect: 'manual',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'decision=allow',
		});
		expect(decisionResp.status).toBe(303);
		const location = decisionResp.headers.get('location');
		expect(location).toBeTruthy();
		const code = new URL(location!).searchParams.get('code');
		expect(code).toBeTruthy();

		// 3. POST /pair/token to exchange the code for a bearer
		const tokenResp = await fetch(`${baseUrl}${AGENT_PAIR_TOKEN_PATH}`, {
			method: 'POST',
			headers: { 'Origin': origin, 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, code_verifier: verifier }),
		});
		expect(tokenResp.status).toBe(200);
		const payload = (await tokenResp.json()) as { token: string; tokenId: string };
		expect(payload.token).toBeTruthy();
		return payload.token;
	}

	function startUpstream(handler: Parameters<typeof createServer>[0]) {
		const server = createServer(handler);
		return new Promise<{ url: string; close: () => Promise<void> }>(res => {
			server.listen(0, '127.0.0.1', () => {
				const addr = server.address();
				if (!addr || typeof addr === 'string') throw new Error('listen returned no port');
				const url = `http://127.0.0.1:${addr.port}`;
				res({
					url,
					close: () =>
						new Promise(r => {
							server.close(() => r());
						}),
				});
			});
		});
	}

	async function runFlight(
		token: string,
		origin: string,
		upstreamUrl: string,
	): Promise<{
		heartbeats: FlightHeartbeatPayload[];
		complete: FlightCompletePayload | null;
		failure: FlightFailedPayload | null;
	}> {
		const heartbeats: FlightHeartbeatPayload[] = [];
		let complete: FlightCompletePayload | null = null;
		let failure: FlightFailedPayload | null = null;

		const requester = createAgentRequester(baseUrl, token);
		const payload: FlightRequestPayload = {
			flightId: `flight-${Date.now()}`,
			requestId: `req-${Date.now()}`,
			request: {
				verb: 'POST',
				url: [upstreamUrl],
				body: { type: 'text', payload: JSON.stringify({ hello: 'world' }) },
				headers: {},
				options: {},
			} as unknown as FlightRequestPayload['request'],
		};

		// Patch global fetch onto the agent's bearer-bound origin so the
		// adapter's Origin header reaches the agent. Vitest jsdom env has
		// undici-style fetch; this test uses it as-is.
		const origin_save = origin; // keep reference for clarity
		const realFetch = globalThis.fetch;
		globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
			const headers = new Headers(init?.headers);
			headers.set('Origin', origin_save);
			return realFetch(input, { ...init, headers });
		};

		try {
			await requester.start({
				payload,
				signal: new AbortController().signal,
				callbacks: {
					heartbeat: h => heartbeats.push(h),
					complete: c => {
						complete = c;
					},
					failed: f => {
						failure = f;
					},
				},
			});
		} finally {
			globalThis.fetch = realFetch;
		}
		return { heartbeats, complete, failure };
	}

	it('completes a flight end-to-end and delivers heartbeats matching the wire contract', async () => {
		const origin = 'https://beak.web';
		const upstream = await startUpstream((req, res) => {
			expect(req.method).toBe('POST');
			res.writeHead(201, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ ok: true }));
		});

		try {
			const token = await pairWithAgent(origin);
			const { heartbeats, complete, failure } = await runFlight(token, origin, upstream.url);

			expect(failure).toBeNull();
			expect(complete).not.toBeNull();

			// The agent's SSE stream MUST envelope each heartbeat as
			// {flightId, stage, payload} — otherwise the renderer's Zod
			// schema rejects every frame and the adapter emits `failed`.
			const stages = heartbeats.map(h => h.stage);
			expect(stages).toContain('fetch_response');
			expect(stages).toContain('head_received');
			expect(stages).toContain('reading_body');

			const head = heartbeats.find(h => h.stage === 'head_received');
			if (head?.stage === 'head_received') {
				expect(head.payload.status).toBe(201);
			} else {
				throw new Error('head_received frame missing payload');
			}

			const readBody = heartbeats.find(h => h.stage === 'reading_body');
			if (readBody?.stage === 'reading_body') {
				// Adapter must have base64-decoded the buffer into a Uint8Array.
				expect(readBody.payload.buffer).toBeInstanceOf(Uint8Array);
				expect(readBody.payload.buffer.length).toBeGreaterThan(0);
			}

			expect(complete!.overview.status).toBe(201);
			expect(complete!.overview.hasBody).toBe(true);
		} finally {
			await upstream.close();
		}
	}, 15_000);

	it('cancellation aborts an in-flight long upstream', async () => {
		const origin = 'https://beak.web';
		let upstreamSawCancel = false;
		const upstream = await startUpstream((req, res) => {
			req.on('close', () => {
				upstreamSawCancel = !res.writableFinished;
			});
			// Never respond — let the test cancel.
			setTimeout(() => {
				if (!res.writableEnded) {
					res.writeHead(200);
					res.end('late');
				}
			}, 5_000);
		});

		try {
			const token = await pairWithAgent(origin);
			const requester = createAgentRequester(baseUrl, token);
			const controller = new AbortController();
			let failure: FlightFailedPayload | null = null;

			const realFetch = globalThis.fetch;
			globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
				const headers = new Headers(init?.headers);
				headers.set('Origin', origin);
				return realFetch(input, { ...init, headers });
			};

			const flightPromise = requester.start({
				payload: {
					flightId: `flight-cancel-${Date.now()}`,
					requestId: `req-cancel-${Date.now()}`,
					request: {
						verb: 'GET',
						url: [upstream.url],
						body: { type: 'text', payload: '' },
						headers: {},
						options: {},
					} as unknown as FlightRequestPayload['request'],
				},
				signal: controller.signal,
				callbacks: {
					heartbeat: () => undefined,
					complete: () => undefined,
					failed: f => {
						failure = f;
					},
				},
			});

			// Let the flight reach the agent before cancelling.
			await new Promise(r => setTimeout(r, 200));
			controller.abort();
			await flightPromise;
			globalThis.fetch = realFetch;

			expect(failure).not.toBeNull();
			expect(failure!.error.message).toBe('flight_cancelled');
			// Give the agent a brief moment to propagate cancellation upstream.
			await vi.waitFor(() => expect(upstreamSawCancel).toBe(true), { timeout: 1_000 });
		} finally {
			await upstream.close();
		}
	}, 15_000);
});

function base64UrlNoPad(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
