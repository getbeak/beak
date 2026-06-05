import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import type { FlightRequestPayload } from '@beak/common/types/requester';
import { type RequesterOptions, startRequester } from '@beak/requester-node';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

const service = new IpcFlightServiceMain(ipcMain);

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const sender = (event as IpcMainInvokeEvent).sender;

	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: p => service.sendHeartbeat(sender, p),
			complete: p => service.sendComplete(sender, p),
			failed: p => service.sendFailed(sender, p),
		},
	};

	// `startRequester` already routes thrown errors to `failed()`, but a fault in
	// the heartbeat/complete callbacks themselves (or the SSE parser, etc.) would
	// otherwise leave the renderer waiting on a promise that never resolves.
	startRequester(options).catch(error => {
		console.error('[flight] requester crashed', error);
		service.sendFailed(sender, { flightId: payload.flightId, error: error as Error });
	});
});
