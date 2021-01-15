import { IpcMain, IpcRenderer, WebContents } from 'electron';

import { FlightCompletePayload, FlightFailedPayload, FlightHeartbeatPayload, FlightRequestPayload } from '../types/requester';
import { AsyncListener, IpcServiceMain, IpcServiceRenderer, SyncListener } from './ipc';

export const FlightMessages = {
	StartFlight: 'start_flight',
	FlightHeartbeat: 'flight_heartbeat',
	FlightComplete: 'flight_complete',
	FlightFailed: 'flight_failed',
};

export interface SetUserReq {
	userId: string;
	fromOnboarding?: boolean;
}

export class IpcFlightServiceRenderer extends IpcServiceRenderer {
	constructor(ipc: IpcRenderer) {
		super('flight', ipc);
	}

	async startFlight(payload: FlightRequestPayload) {
		this.ipc.invoke(this.channel, {
			code: FlightMessages.StartFlight,
			payload,
		});
	}

	registerFlightHeartbeat(fn: SyncListener<FlightHeartbeatPayload>) {
		this.registerListener(FlightMessages.FlightHeartbeat, fn);
	}

	registerFlightComplete(fn: SyncListener<FlightCompletePayload>) {
		this.registerListener(FlightMessages.FlightComplete, fn);
	}

	registerFlightFailed(fn: SyncListener<FlightFailedPayload>) {
		this.registerListener(FlightMessages.FlightFailed, fn);
	}
}

export class IpcFlightServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('flight', ipc);
	}

	registerStartFlight(fn: AsyncListener<FlightRequestPayload, void>) {
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
