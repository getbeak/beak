import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import { FlightRequestPayload } from '@beak/common/types/requester';
import { RequesterOptions, startRequester } from '@beak/requester-node';
import { ipcMain } from 'electron';

const service = new IpcFlightServiceMain(ipcMain);

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: payload => service.sendHeartbeat(event.sender, payload),
			complete: payload => service.sendComplete(event.sender, payload),
			failed: payload => service.sendFailed(event.sender, payload),
		},
	};

	startRequester(options).then();
});
