import type { WebContents } from 'electron';
import { z } from 'zod';

import type {
	FlightCompletePayload,
	FlightFailedPayload,
	FlightHeartbeatPayload,
	FlightRequestPayload,
} from '../types/requester';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const FlightMessages = {
	StartFlight: 'start_flight',
	CancelFlight: 'cancel_flight',
	FlightHeartbeat: 'flight_heartbeat',
	FlightComplete: 'flight_complete',
	FlightFailed: 'flight_failed',
} as const;

export type FlightMessageType = (typeof FlightMessages)[keyof typeof FlightMessages];

// Renderer→main validation for inbound requests. Loose on the nested `request`
// (it grows; `.passthrough()` keeps us forward-compatible) but strict on the
// envelope so wire-protocol breakage gets caught at the boundary.
//
// Outbound events from main→renderer are NOT validated by the listeners: both
// ends are trusted Beak code, and the existing tests use placeholder payloads
// that intentionally don't model the wire format.
const StartFlightSchema = z.object({
	flightId: z.string().min(1),
	requestId: z.string().min(1),
	projectFolder: z.string().optional(),
	request: z
		.object({
			verb: z.string(),
			url: z.array(z.unknown()),
			body: z.object({ type: z.string() }).passthrough(),
		})
		.passthrough(),
});

const CancelFlightSchema = z.object({
	flightId: z.string().min(1),
});

export type CancelFlightPayload = z.infer<typeof CancelFlightSchema>;

export class IpcFlightServiceRenderer extends IpcServiceRenderer<'flight'> {
	constructor(ipc: PartialIpcRenderer) {
		super('flight', ipc);
	}

	async startFlight(payload: FlightRequestPayload) {
		return this.invoke(FlightMessages.StartFlight, payload);
	}

	async cancelFlight(payload: CancelFlightPayload) {
		return this.invoke(FlightMessages.CancelFlight, payload);
	}

	registerFlightHeartbeat(fn: IpcListener<FlightHeartbeatPayload>) {
		this.registerListener(FlightMessages.FlightHeartbeat, fn);
	}

	registerFlightComplete(fn: IpcListener<FlightCompletePayload>) {
		this.registerListener(FlightMessages.FlightComplete, fn);
	}

	registerFlightFailed(fn: IpcListener<FlightFailedPayload>) {
		this.registerListener(FlightMessages.FlightFailed, fn);
	}

	unregister(message: FlightMessageType): void {
		this.unregisterListener(message);
	}
}

export class IpcFlightServiceMain extends IpcServiceMain<'flight'> {
	constructor(ipc: PartialIpcMain) {
		super('flight', ipc);
	}

	registerStartFlight(fn: IpcListener<FlightRequestPayload>) {
		this.registerRequestHandler(FlightMessages.StartFlight, fn, StartFlightSchema as never);
	}

	registerCancelFlight(fn: IpcListener<CancelFlightPayload>) {
		this.registerRequestHandler(FlightMessages.CancelFlight, fn, CancelFlightSchema as never);
	}

	sendHeartbeat(wc: WebContents, payload: FlightHeartbeatPayload) {
		this.sendMessage(wc, FlightMessages.FlightHeartbeat, payload);
	}

	sendComplete(wc: WebContents, payload: FlightCompletePayload) {
		this.sendMessage(wc, FlightMessages.FlightComplete, payload);
	}

	sendFailed(wc: WebContents, payload: FlightFailedPayload) {
		this.sendMessage(wc, FlightMessages.FlightFailed, payload);
	}
}
