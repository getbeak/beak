import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import { FlightRequestPayload } from '@beak/common/types/requester';

import { RequesterOptions, startRequester } from '../requester';
import { webIpcMain } from './ipc';

const service = new IpcFlightServiceMain(webIpcMain);

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const options: RequesterOptions = {
		payload,
		callbacks: {
			// heartbeat: payload => service.sendHeartbeat(sender, payload),
			// complete: payload => service.sendComplete(sender, payload),
			// failed: payload => service.sendFailed(sender, payload),

			heartbeat: console.info,
			complete: console.info,
			failed: console.info,
		},
	};

	startRequester(options).then();
});
