import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import type { FlightRequestPayload } from '@beak/common/types/requester';
import { type RequesterOptions, startRequester } from '@beak/requester-node';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

const service = new IpcFlightServiceMain(ipcMain);

// One AbortController per in-flight flight. Released on complete/failed.
const inFlight = new Map<string, AbortController>();

function releaseController(flightId: string): void {
	inFlight.delete(flightId);
}

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const sender = (event as IpcMainInvokeEvent).sender;
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
				service.sendFailed(sender, p);
			},
		},
	};

	// `startRequester` already routes thrown errors to `failed()`, but a fault in
	// the heartbeat/complete callbacks themselves (or the SSE parser, etc.) would
	// otherwise leave the renderer waiting on a promise that never resolves.
	startRequester(options).catch(error => {
		releaseController(payload.flightId);
		console.error('[flight] requester crashed', error);
		service.sendFailed(sender, { flightId: payload.flightId, error: error as Error });
	});
});

service.registerCancelFlight(async (_event, { flightId }) => {
	const controller = inFlight.get(flightId);
	if (!controller) return;
	controller.abort();
	// `startRequester` observes the aborted signal and emits
	// `failed({error: 'flight_cancelled'})`; the failed callback releases.
});
