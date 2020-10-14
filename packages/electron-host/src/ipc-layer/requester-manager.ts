import { FlightMessages, FlightRequestPayload } from '@beak/common/src/requester/types';
import { RequesterOptions, startRequester } from '@beak/requester-node/src';
import { ipcMain } from 'electron';

ipcMain.on('flight_request', (event, payload: FlightRequestPayload) => {
	const { flightId } = payload;

	const options: RequesterOptions = {
		payload,
		callbacks: {
			heartbeat: payload => {
				event.reply(`${FlightMessages.heartbeat}:${flightId}`, payload);
			},
			complete: payload => {
				event.reply(`${FlightMessages.complete}:${flightId}`, payload);
			},
			failed: payload => {
				event.reply(`${FlightMessages.failed}:${flightId}`, payload);
			},
		},
	};

	startRequester(options).then();
});
