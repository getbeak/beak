import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import { FlightRequestPayload } from '@beak/common/types/requester';
import { RequesterOptions, startRequester } from '@beak/requester-node';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

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
