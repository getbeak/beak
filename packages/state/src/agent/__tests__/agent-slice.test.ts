import { describe, expect, it } from 'vitest';

import reducer, {
	agentDiscovered,
	agentUnreachable,
	hydrateAgent,
	pairingFailed,
	pairingSucceeded,
	selectAgentBaseUrl,
	selectAgentLastSeenAt,
	selectAgentPairingError,
	selectAgentRoutingMode,
	selectAgentStatus,
	selectAgentTokenId,
	selectAgentVersion,
	setAgentStatus,
	setRoutingMode,
	startDiscovery,
	startPairing,
	tokenRevoked,
	verifyImpostor,
	verifyOk,
} from '../agent-slice';
import { type AgentRoutingMode, type AgentSliceState, type AgentStatus, initialAgentState } from '../types';

describe('agentSlice reducer', () => {
	describe('setAgentStatus', () => {
		it('updates status for every AgentStatus value and leaves the rest of state untouched', () => {
			const statuses: AgentStatus[] = [
				'idle',
				'discovering',
				'unreachable',
				'unpaired',
				'pairing',
				'paired',
				'verifying',
				'impostor',
			];

			for (const status of statuses) {
				const result = reducer(initialAgentState, setAgentStatus(status));
				expect(result).toEqual({
					status,
					routingMode: 'agent-when-available',
				});
			}
		});
	});

	describe('startDiscovery', () => {
		it('sets status to discovering from idle', () => {
			const result = reducer(initialAgentState, startDiscovery());
			expect(result).toEqual({
				status: 'discovering',
				routingMode: 'agent-when-available',
			});
		});

		it('clears a previously set pairingError', () => {
			const previous: AgentSliceState = {
				status: 'unpaired',
				routingMode: 'agent-when-available',
				pairingError: 'denied',
			};
			const result = reducer(previous, startDiscovery());
			expect(result).toEqual({
				status: 'discovering',
				routingMode: 'agent-when-available',
			});
		});
	});

	describe('agentDiscovered', () => {
		it('lands in unpaired on a cold start (no tokenId)', () => {
			const result = reducer(
				initialAgentState,
				agentDiscovered({
					baseUrl: 'http://127.0.0.1:47821',
					agentVersion: '0.1.0',
					agentSupports: ['flight.v1'],
					lastSeenAt: 1717_000_000_000,
				}),
			);

			expect(result).toEqual({
				status: 'unpaired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				agentVersion: '0.1.0',
				agentSupports: ['flight.v1'],
				lastSeenAt: 1717_000_000_000,
			});
		});

		it('lands in verifying when tokenId is already hydrated (regression: b891ede4)', () => {
			const hydrated: AgentSliceState = {
				status: 'idle',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
			};
			const result = reducer(
				hydrated,
				agentDiscovered({
					baseUrl: 'http://127.0.0.1:47821',
					agentVersion: '0.1.0',
					agentSupports: ['flight.v1'],
					lastSeenAt: 1717_000_000_000,
				}),
			);

			expect(result).toEqual({
				status: 'verifying',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
				baseUrl: 'http://127.0.0.1:47821',
				agentVersion: '0.1.0',
				agentSupports: ['flight.v1'],
				lastSeenAt: 1717_000_000_000,
			});
		});
	});

	describe('agentUnreachable', () => {
		it('sets status to unreachable and deletes baseUrl', () => {
			const previous: AgentSliceState = {
				status: 'paired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				agentVersion: '0.1.0',
				lastSeenAt: 1717_000_000_000,
			};
			const result = reducer(previous, agentUnreachable());
			expect(result).toEqual({
				status: 'unreachable',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
				agentVersion: '0.1.0',
				lastSeenAt: 1717_000_000_000,
			});
		});
	});

	describe('startPairing', () => {
		it('sets status to pairing and clears pairingError', () => {
			const previous: AgentSliceState = {
				status: 'unpaired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				pairingError: 'access_denied',
			};
			const result = reducer(previous, startPairing());
			expect(result).toEqual({
				status: 'pairing',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
			});
		});
	});

	describe('pairingSucceeded', () => {
		it('lands in paired with tokenId + lastSeenAt and clears pairingError', () => {
			const previous: AgentSliceState = {
				status: 'pairing',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				pairingError: 'stale_attempt',
			};
			const result = reducer(
				previous,
				pairingSucceeded({ tokenId: 'k1', lastSeenAt: 1717_000_000_000 }),
			);
			expect(result).toEqual({
				status: 'paired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				lastSeenAt: 1717_000_000_000,
			});
		});
	});

	describe('pairingFailed', () => {
		it('sets status to unpaired and records pairingError', () => {
			const previous: AgentSliceState = {
				status: 'pairing',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
			};
			const result = reducer(previous, pairingFailed({ error: 'access_denied' }));
			expect(result).toEqual({
				status: 'unpaired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				pairingError: 'access_denied',
			});
		});
	});

	describe('verifyOk', () => {
		it('sets status to paired and updates lastSeenAt', () => {
			const previous: AgentSliceState = {
				status: 'verifying',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				lastSeenAt: 1717_000_000_000,
			};
			const result = reducer(previous, verifyOk({ lastSeenAt: 1717_000_000_999 }));
			expect(result).toEqual({
				status: 'paired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				lastSeenAt: 1717_000_000_999,
			});
		});
	});

	describe('verifyImpostor', () => {
		it('sets status to impostor and deletes baseUrl (per agent-control-plane.feature)', () => {
			const previous: AgentSliceState = {
				status: 'verifying',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				agentVersion: '0.1.0',
				lastSeenAt: 1717_000_000_000,
			};
			const result = reducer(previous, verifyImpostor());
			expect(result).toEqual({
				status: 'impostor',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
				agentVersion: '0.1.0',
				lastSeenAt: 1717_000_000_000,
			});
		});
	});

	describe('tokenRevoked', () => {
		it('lands in unpaired when baseUrl is present', () => {
			const previous: AgentSliceState = {
				status: 'paired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				tokenId: 'k1',
				lastSeenAt: 1717_000_000_000,
			};
			const result = reducer(previous, tokenRevoked());
			expect(result).toEqual({
				status: 'unpaired',
				routingMode: 'agent-when-available',
				baseUrl: 'http://127.0.0.1:47821',
				lastSeenAt: 1717_000_000_000,
			});
		});

		it('lands in unreachable when baseUrl is absent', () => {
			const previous: AgentSliceState = {
				status: 'paired',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
				lastSeenAt: 1717_000_000_000,
			};
			const result = reducer(previous, tokenRevoked());
			expect(result).toEqual({
				status: 'unreachable',
				routingMode: 'agent-when-available',
				lastSeenAt: 1717_000_000_000,
			});
		});
	});

	describe('setRoutingMode', () => {
		it('flows every routing mode through cleanly', () => {
			const modes: AgentRoutingMode[] = ['agent-when-available', 'agent-only', 'browser-only'];
			for (const mode of modes) {
				const result = reducer(initialAgentState, setRoutingMode(mode));
				expect(result).toEqual({
					status: 'idle',
					routingMode: mode,
				});
			}
		});
	});

	describe('hydrateAgent', () => {
		it('merges partial state without erasing untouched keys', () => {
			const previous: AgentSliceState = {
				status: 'idle',
				routingMode: 'agent-only',
				baseUrl: 'http://127.0.0.1:47821',
				agentVersion: '0.1.0',
			};
			const result = reducer(previous, hydrateAgent({ tokenId: 'k1' }));
			expect(result).toEqual({
				status: 'idle',
				routingMode: 'agent-only',
				baseUrl: 'http://127.0.0.1:47821',
				agentVersion: '0.1.0',
				tokenId: 'k1',
			});
		});

		it('overrides keys that are explicitly provided', () => {
			const previous: AgentSliceState = {
				status: 'unpaired',
				routingMode: 'agent-when-available',
				tokenId: 'old-token',
				baseUrl: 'http://127.0.0.1:47821',
			};
			const result = reducer(previous, hydrateAgent({ tokenId: 'new-token', status: 'verifying' }));
			expect(result).toEqual({
				status: 'verifying',
				routingMode: 'agent-when-available',
				tokenId: 'new-token',
				baseUrl: 'http://127.0.0.1:47821',
			});
		});

		it('seeds tokenId pre-discovery so agentDiscovered routes through verifying (regression: b891ede4)', () => {
			const hydrated = reducer(initialAgentState, hydrateAgent({ tokenId: 'k1' }));
			expect(hydrated).toEqual({
				status: 'idle',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
			});

			const discovered = reducer(
				hydrated,
				agentDiscovered({
					baseUrl: 'http://127.0.0.1:47821',
					agentVersion: '0.1.0',
					agentSupports: ['flight.v1'],
					lastSeenAt: 1717_000_000_000,
				}),
			);
			expect(discovered).toEqual({
				status: 'verifying',
				routingMode: 'agent-when-available',
				tokenId: 'k1',
				baseUrl: 'http://127.0.0.1:47821',
				agentVersion: '0.1.0',
				agentSupports: ['flight.v1'],
				lastSeenAt: 1717_000_000_000,
			});
		});
	});
});

describe('agentSlice selectors', () => {
	const agent: AgentSliceState = {
		status: 'paired',
		routingMode: 'agent-only',
		baseUrl: 'http://127.0.0.1:47821',
		tokenId: 'k1',
		agentVersion: '0.1.0',
		agentSupports: ['flight.v1'],
		lastSeenAt: 1717_000_000_000,
		pairingError: 'previous_attempt_failed',
	};
	const rootState = { global: { agent } };

	it('selectAgentStatus returns the status', () => {
		expect(selectAgentStatus(rootState)).toBe('paired');
	});

	it('selectAgentBaseUrl returns the baseUrl', () => {
		expect(selectAgentBaseUrl(rootState)).toBe('http://127.0.0.1:47821');
	});

	it('selectAgentTokenId returns the tokenId', () => {
		expect(selectAgentTokenId(rootState)).toBe('k1');
	});

	it('selectAgentRoutingMode returns the routing mode', () => {
		expect(selectAgentRoutingMode(rootState)).toBe('agent-only');
	});

	it('selectAgentVersion returns the agentVersion', () => {
		expect(selectAgentVersion(rootState)).toBe('0.1.0');
	});

	it('selectAgentLastSeenAt returns lastSeenAt', () => {
		expect(selectAgentLastSeenAt(rootState)).toBe(1717_000_000_000);
	});

	it('selectAgentPairingError returns pairingError', () => {
		expect(selectAgentPairingError(rootState)).toBe('previous_attempt_failed');
	});

	it('returns undefined for unset optional fields', () => {
		const emptyRoot = { global: { agent: initialAgentState } };
		expect(selectAgentBaseUrl(emptyRoot)).toBeUndefined();
		expect(selectAgentTokenId(emptyRoot)).toBeUndefined();
		expect(selectAgentVersion(emptyRoot)).toBeUndefined();
		expect(selectAgentLastSeenAt(emptyRoot)).toBeUndefined();
		expect(selectAgentPairingError(emptyRoot)).toBeUndefined();
	});
});
