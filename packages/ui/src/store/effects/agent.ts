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
			const discovered = cached && cachedHealthz ? { baseUrl: cached, healthz: cachedHealthz } : await discoverAgent();

			if (!discovered) {
				clearCachedAgentBaseUrl();
				api.dispatch(agentUnreachable());
				return;
			}

			setCachedAgentBaseUrl(discovered.baseUrl);
			api.dispatch(
				agentDiscovered({
					baseUrl: discovered.baseUrl,
					agentVersion: discovered.healthz.version,
					agentSupports: discovered.healthz.supports,
					lastSeenAt: Date.now(),
				}),
			);

			// If we already hold a token, prove the loopback endpoint is the
			// real agent before we trust it for flights.
			const token = getAgentToken();
			if (token) {
				const ok = await verifyAgentIdentity(discovered.baseUrl, token);
				if (ok) api.dispatch(verifyOk({ lastSeenAt: Date.now() }));
				else {
					clearCachedAgentBaseUrl();
					api.dispatch(verifyImpostor());
				}
			}
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
