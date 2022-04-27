import { IpcMain, WebContents } from 'electron';

import { FlightCompletePayload, FlightFailedPayload, FlightHeartbeatPayload, FlightRequestPayload } from '../types/requester';
import { IpcServiceMain, IpcServiceRenderer, Listener, PartialIpcRenderer } from './ipc';

export const FlightMessages = {
	StartFlight: 'start_flight',
	FlightHeartbeat: 'flight_heartbeat',
	FlightComplete: 'flight_complete',
	FlightFailed: 'flight_failed',
};

export class IpcFlightServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: PartialIpcRenderer) {
		super('flight', ipc);
	}

	async startFlight(payload: FlightRequestPayload) {
		await this.invoke(FlightMessages.StartFlight, payload);
	}

	registerFlightHeartbeat(fn: Listener<FlightHeartbeatPayload>) {
		this.registerListener(FlightMessages.FlightHeartbeat, fn);
	}

	registerFlightComplete(fn: Listener<FlightCompletePayload>) {
		this.registerListener(FlightMessages.FlightComplete, fn);
	}

	registerFlightFailed(fn: Listener<FlightFailedPayload>) {
		this.registerListener(FlightMessages.FlightFailed, fn);
	}
}

export class IpcFlightServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('flight', ipc);
	}

	registerStartFlight(fn: Listener<FlightRequestPayload, void>) {
		this.registerListener(FlightMessages.StartFlight, fn);
	}

	sendHeartbeat(wc: WebContents, payload: FlightHeartbeatPayload) {
		wc.send(this.channel, {
			code: FlightMessages.FlightHeartbeat,
			payload,
		});
	}

	sendComplete(wc: WebContents, payload: FlightCompletePayload) {
		wc.send(this.channel, {
			code: FlightMessages.FlightComplete,
			payload,
		});
	}

	sendFailed(wc: WebContents, payload: FlightFailedPayload) {
		wc.send(this.channel, {
			code: FlightMessages.FlightFailed,
			payload,
		});
	}
}
