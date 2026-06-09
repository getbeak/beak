import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import type { FlightRequestPayload } from '@beak/common/types/requester';
import { agentUnreachable, decideRouting, selectAgentBaseUrl, tokenRevoked } from '@beak/state/agent';
import { getAppStore } from '@beak/ui/store';

import { clearAgentToken, clearCachedAgentBaseUrl, getAgentToken } from '@beak/ui/services/agent/storage';

import getRuntime from '../host';
import { browserFetchRequester, createAgentRequester, type Requester, type RequesterOptions } from '../requester';
import { webIpcMain } from './ipc';

const service = new IpcFlightServiceMain(webIpcMain);
const sender = webIpcMain.webContents;

// One AbortController per in-flight flight. Released on complete/failed
// (regardless of cancel origin) so a never-cleaned-up controller can't pin
// memory or signal a stale `aborted` to a recycled flightId.
const inFlight = new Map<string, AbortController>();

function releaseController(flightId: string): void {
	inFlight.delete(flightId);
}

service.registerStartFlight(async (_event, payload: FlightRequestPayload) => {
	const controller = new AbortController();
	inFlight.set(payload.flightId, controller);

	const options: RequesterOptions = {
		payload,
		signal: controller.signal,
		callbacks: {
			heartbeat: p => service.sendHeartbeat(sender, p),
			complete: p => {
				releaseController(p.flightId);
				service.sendComplete(sender, p);
			},
			failed: p => {
				releaseController(p.flightId);
				if (p.error?.message === 'agent_unauthorized') {
					clearAgentToken();
					// Surface the unpaired state to the slice so the renderer
					// banner re-appears instead of silently falling back to
					// browser-fetch on the next flight.
					getAppStore().dispatch(tokenRevoked());
				} else if (p.error?.message === 'agent_disconnected') {
					// Mid-flight network drop or pre-connect refusal — the
					// agent went away. Evict the cached URL and flip the
					// slice so the banner offers Re-scan instead of silently
					// retrying against a dead port on the next flight.
					clearCachedAgentBaseUrl();
					getAppStore().dispatch(agentUnreachable());
				}
				service.sendFailed(sender, p);
			},
		},
	};

	const requester = pickRequester();
	if (requester === 'force-fail') {
		releaseController(payload.flightId);
		service.sendFailed(sender, {
			flightId: payload.flightId,
			error: new Error('agent_required_but_not_paired'),
		});
		return;
	}

	requester.start(options).catch(error => {
		releaseController(payload.flightId);
		console.error('[flight] requester crashed', error);
		service.sendFailed(sender, { flightId: payload.flightId, error: error as Error });
	});
});

service.registerCancelFlight(async (_event, { flightId }) => {
	const controller = inFlight.get(flightId);
	if (!controller) return; // Already completed or never started.
	controller.abort();
	// Requesters observe the aborted signal and emit `failed({error:
	// 'flight_cancelled'})`; that's where `releaseController` runs.
});

function pickRequester(): Requester | 'force-fail' {
	const { capabilities } = getRuntime();
	const store = getAppStore();
	const state = store.getState();
	const decision = decideRouting({
		capability: capabilities.localAgent,
		status: state.global.agent.status,
		routingMode: state.global.agent.routingMode,
	});

	switch (decision) {
		case 'via-default':
			return browserFetchRequester;
		case 'force-fail':
			return 'force-fail';
		case 'via-agent': {
			const baseUrl = selectAgentBaseUrl(state);
			const token = getAgentToken();
			if (!baseUrl || !token) {
				// State says paired but the corresponding handles are missing —
				// shouldn't happen, but degrade gracefully.
				return browserFetchRequester;
			}
			return createAgentRequester(baseUrl, token);
		}
	}
}
