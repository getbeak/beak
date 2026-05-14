import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import type { FlightRequestPayload } from '@beak/common/types/requester';

import { type RequesterOptions, startRequester } from '../requester';
import { webIpcMain } from './ipc';

const service = new IpcFlightServiceMain(webIpcMain);
const sender = webIpcMain.webContents;

service.registerStartFlight(async (_event, payload: FlightRequestPayload) => {
	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: p => service.sendHeartbeat(sender, p),
			complete: p => service.sendComplete(sender, p),
			failed: p => service.sendFailed(sender, p),
		},
	};

	startRequester(options).catch(error => {
		console.error('[flight] requester crashed', error);
		service.sendFailed(sender, { flightId: payload.flightId, error: error as Error });
	});
});
