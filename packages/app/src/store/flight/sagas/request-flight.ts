import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/variable-input/parser';
import binaryStore from '@beak/app/lib/binary-store';
import { ipcFlightService } from '@beak/app/lib/ipc';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { RequestBody, RequestNode, RequestOverview, ToggleKeyValue, VariableGroups } from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FlightMessages } from '@beak/common/ipc/flight';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { END, eventChannel } from 'redux-saga';
import { put, select, take } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { State as VGState } from '../../variable-groups/types';
import * as actions from '../actions';
import { State } from '../types';

export default function* requestFlightWorker() {
	const binaryStoreKey = ksuid.generate('binstore').toString();
	const requestId: string = yield select((s: ApplicationState) => s.global.project.selectedTabPayload);
	const flightId = ksuid.generate('flight').toString();

	const flight: State = yield select((s: ApplicationState) => s.global.flight);
	const node: RequestNode = yield select((s: ApplicationState) => s.global.project.tree![requestId]);
	const vgState: VGState = yield select((s: ApplicationState) => s.global.variableGroups);
	const { selectedGroups, variableGroups } = vgState;
	const flattenedOverview = flattenRequestOverview(node.info, selectedGroups, variableGroups);

	// If the node doesn't exist, either it has been deleted, or a non-request tab was
	// sent through, either way, cancel.
	if (!node)
		return;

	if (flight.currentFlight?.flighting) {
		// TODO(afr): Ask user if they want to cancel existing, or cancel new

		return;
	}

	binaryStore.create(binaryStoreKey);

	yield put(actions.beginFlightRequest({
		binaryStoreKey,
		requestId,
		flightId,
		request: flattenedOverview,
	}));

	const channel = eventChannel(emitter => {
		ipcFlightService.registerFlightHeartbeat((_event, payload) => {
			if (payload.stage === 'reading_body')
				binaryStore.append(binaryStoreKey, payload.payload.buffer);

			emitter(actions.updateFlightProgress(payload));
		});

		ipcFlightService.registerFlightComplete((_event, payload) => {
			emitter(actions.completeFlight({ flightId, requestId, response: payload.overview }));
			emitter(END);
		});

		ipcFlightService.registerFlightFailed((_event, payload) => {
			emitter(actions.flightFailure({ flightId, requestId, error: payload.error }));
			emitter(END);
		});

		return () => {
			ipcFlightService.unregisterListener(FlightMessages.FlightHeartbeat);
			ipcFlightService.unregisterListener(FlightMessages.FlightComplete);
			ipcFlightService.unregisterListener(FlightMessages.FlightFailed);
		};
	});

	ipcFlightService.startFlight({
		flightId,
		requestId,
		request: flattenedOverview,
	});

	while (true) {
		const result = yield take(channel);

		if (result === null)
			break;

		yield put(result);
	}
}

function flattenRequestOverview(
	overview: RequestOverview,
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
): RequestOverview {
	const url = convertRequestToUrl(selectedGroups, variableGroups, overview);

	return {
		...overview,
		url: [url.toString()],
		query: flattenToggleValueParts(overview.query, selectedGroups, variableGroups),
		headers: flattenToggleValueParts(overview.headers, selectedGroups, variableGroups),
		body: flattenBody(selectedGroups, variableGroups, overview.body),
	};
}

function flattenToggleValueParts(
	toggleValueParts: Record<string, ToggleKeyValue>,
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
): Record<string, ToggleKeyValue> {
	return TypedObject.keys(toggleValueParts).reduce((acc, val) => ({
		...acc,
		[val]: {
			...toggleValueParts[val],
			value: [parseValueParts(selectedGroups, variableGroups, toggleValueParts[val].value)],
		},
	}), {});
}

function flattenBody(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	body: RequestBody,
): RequestBody {
	switch (body.type) {
		case 'text':
			return body;

		case 'json': {
			const json = convertToRealJson(selectedGroups, variableGroups, body.payload);

			return {
				type: 'text',
				payload: JSON.stringify(json),
			};
		}

		default: return { type: 'text', payload: 'not done yet' };
	}
}
