import { IpcFlightServiceMain } from '@beak/common/ipc/flight';
import { FlightRequestPayload } from '@beak/common/types/requester';
import { RequesterOptions, startRequester } from '@beak/requester-node';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

import arbiter from '../lib/arbiter';

const service = new IpcFlightServiceMain(ipcMain);

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const status = arbiter.getStatus();

	// TODO(afr): Check status, if not okay then return an error

	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: payload => service.sendHeartbeat((event as IpcMainInvokeEvent).sender, payload),
			complete: payload => service.sendComplete((event as IpcMainInvokeEvent).sender, payload),
			failed: payload => service.sendFailed((event as IpcMainInvokeEvent).sender, payload),
		},
	};

	startRequester(options).then();
});
