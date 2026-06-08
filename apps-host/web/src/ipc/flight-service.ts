import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import type { FlightRequestPayload } from '@beak/common/types/requester';
import { decideRouting, selectAgentBaseUrl, tokenRevoked } from '@beak/state/agent';
import { getAppStore } from '@beak/ui/store';

import { clearAgentToken, getAgentToken } from '@beak/ui/services/agent/storage';

import getRuntime from '../host';
import { browserFetchRequester, createAgentRequester, type Requester, type RequesterOptions } from '../requester';
import { webIpcMain } from './ipc';

const service = new IpcFlightServiceMain(webIpcMain);
const sender = webIpcMain.webContents;

service.registerStartFlight(async (_event, payload: FlightRequestPayload) => {
	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: p => service.sendHeartbeat(sender, p),
			complete: p => service.sendComplete(sender, p),
			failed: p => {
				if (p.error?.message === 'agent_unauthorized') {
					clearAgentToken();
					// Surface the unpaired state to the slice so the renderer
					// banner re-appears instead of silently falling back to
					// browser-fetch on the next flight.
					getAppStore().dispatch(tokenRevoked());
				}
				service.sendFailed(sender, p);
			},
		},
	};

	const requester = pickRequester();
	if (requester === 'force-fail') {
		service.sendFailed(sender, {
			flightId: payload.flightId,
			error: new Error('agent_required_but_not_paired'),
		});
		return;
	}

	requester.start(options).catch(error => {
		console.error('[flight] requester crashed', error);
		service.sendFailed(sender, { flightId: payload.flightId, error: error as Error });
	});
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
