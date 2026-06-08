import {
	agentDiscovered,
	agentUnreachable,
	pairingFailed,
	pairingSucceeded,
	startDiscovery,
	startPairing as startPairingAction,
	tokenRevoked,
	verifyImpostor,
	verifyOk,
} from '@beak/state/agent';
import { createAction } from '@reduxjs/toolkit';

import {
	clearAgentToken,
	clearCachedAgentBaseUrl,
	completePairing,
	discoverAgent,
	getAgentToken,
	getCachedAgentBaseUrl,
	type PairingReturnQuery,
	probe,
	setAgentToken,
	setCachedAgentBaseUrl,
	startPairing as startPairingFlow,
	verifyAgentIdentity,
} from '../../services/agent';
import type { AppStartListening } from '../listener';

/**
 * Trigger actions. Effects below react to these and dispatch the actual
 * slice mutations. The split keeps slice reducers pure and concentrates
 * all `fetch` / sessionStorage / window.open side-effects here.
 */
export const discoverAgentRequested = createAction('agent/discoverRequested');
export const startAgentPairingRequested = createAction<{ returnUrl: string }>('agent/startPairingRequested');
export const completeAgentPairingRequested = createAction<PairingReturnQuery>('agent/completePairingRequested');
export const revokeAgentLocally = createAction('agent/revokeLocally');

export function registerAgentEffects(startListening: AppStartListening): void {
	startListening({
		actionCreator: discoverAgentRequested,
		effect: async (_action, api) => {
			api.dispatch(startDiscovery());

			// Try the cached URL first; it's almost always the right answer.
			const cached = getCachedAgentBaseUrl();
			const cachedHealthz = cached ? await probe(cached) : null;
			let discovered = cached && cachedHealthz ? { baseUrl: cached, healthz: cachedHealthz } : await discoverAgent();

			const token = getAgentToken();
			const impostors: string[] = [];

			// Discover → verify → retry-on-impostor loop. Each iteration
			// considers one candidate URL: if its identity verifies (or we
			// have no token to verify with) we land on it; if it's an
			// impostor we record the URL and ask discovery for the next-best
			// port. Without this loop a single impostor would lock the
			// paired user out of the real agent.
			while (discovered) {
				setCachedAgentBaseUrl(discovered.baseUrl);
				api.dispatch(
					agentDiscovered({
						baseUrl: discovered.baseUrl,
						agentVersion: discovered.healthz.version,
						agentSupports: discovered.healthz.supports,
						lastSeenAt: Date.now(),
					}),
				);

				if (!token) return; // No token → impostor check doesn't apply.

				const ok = await verifyAgentIdentity(discovered.baseUrl, token);
				if (ok) {
					api.dispatch(verifyOk({ lastSeenAt: Date.now() }));
					return;
				}

				// Impostor — drop the cache and keep scanning past it. The
				// slice flips to `impostor` transiently; the next iteration
				// replaces it with `verifying` once another candidate
				// appears, or with `unreachable` if scanning is exhausted.
				impostors.push(discovered.baseUrl);
				clearCachedAgentBaseUrl();
				api.dispatch(verifyImpostor());
				discovered = await discoverAgent(impostors);
			}

			// Either the initial discovery returned null, or we exhausted
			// the port range chasing impostors.
			clearCachedAgentBaseUrl();
			api.dispatch(agentUnreachable());
		},
	});

	startListening({
		actionCreator: startAgentPairingRequested,
		effect: async (action, api) => {
			const state = api.getState();
			const baseUrl = state.global.agent.baseUrl;
			if (!baseUrl) {
				api.dispatch(pairingFailed({ error: 'agent_unreachable' }));
				return;
			}
			api.dispatch(startPairingAction());
			try {
				await startPairingFlow(baseUrl, action.payload.returnUrl);
			} catch (error) {
				api.dispatch(pairingFailed({ error: (error as Error).message }));
			}
		},
	});

	startListening({
		actionCreator: completeAgentPairingRequested,
		effect: async (action, api) => {
			try {
				const completed = await completePairing(action.payload);
				setAgentToken(completed.token, completed.tokenId);
				setCachedAgentBaseUrl(completed.baseUrl);
				api.dispatch(pairingSucceeded({ tokenId: completed.tokenId, lastSeenAt: Date.now() }));
			} catch (error) {
				api.dispatch(pairingFailed({ error: (error as Error).message }));
			}
		},
	});

	startListening({
		actionCreator: revokeAgentLocally,
		effect: (_action, api) => {
			clearAgentToken();
			api.dispatch(tokenRevoked());
		},
	});
}
