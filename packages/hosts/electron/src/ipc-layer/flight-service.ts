import { IpcFlightServiceMain } from '@beak/shared-common/ipc/flight';
import { FlightRequestPayload } from '@beak/shared-common/types/requester';
import Squawk from '@beak/shared-common/utils/squawk';
import { RequesterOptions, startRequester } from '@beak/shared-requester-node';
import { ipcMain, IpcMainInvokeEvent } from 'electron';

import arbiter from '../lib/arbiter';

const service = new IpcFlightServiceMain(ipcMain);

service.registerStartFlight(async (event, payload: FlightRequestPayload) => {
	const status = arbiter.getStatus();
	const sender = (event as IpcMainInvokeEvent).sender;

	if (!status.status) {
		service.sendFailed(sender, { error: new Squawk('beak_authentication_failure') });

		return;
	}

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
