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
			heartbeat: payload => service.sendHeartbeat(sender, payload),
			complete: payload => service.sendComplete(sender, payload),
			failed: payload => service.sendFailed(sender, payload),
		},
	};

	startRequester(options).then();
});
