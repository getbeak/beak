import { instance as windowSessionInstance } from '@beak/app/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/app/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/realtime-values/parser';
import { Context } from '@beak/app/features/realtime-values/types';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import {
	RequestBody,
	RequestBodyText,
	RequestNode,
	RequestOverview,
	ToggleKeyValue,
} from '@beak/common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { State as VGState } from '../../variable-groups/types';
import * as actions from '../actions';
import { State } from '../types';

export default function* requestFlightWorker() {
	const binaryStoreKey = ksuid.generate('binstore').toString();
	const requestId: string = yield select((s: ApplicationState) => s.features.tabs.selectedTab);
	const flightId = ksuid.generate('flight').toString();

	const flight: State = yield select((s: ApplicationState) => s.global.flight);
	const node: RequestNode = yield select((s: ApplicationState) => s.global.project.tree![requestId]);
	const vgState: VGState = yield select((s: ApplicationState) => s.global.variableGroups);
	const selectedGroups: Record<string, string> = yield select(
		(s: ApplicationState) => s.global.preferences.editor.selectedVariableGroups,
	);

	const { variableGroups } = vgState;
	const context = { selectedGroups, variableGroups };
	const preparedRequest: RequestOverview = yield call(prepareRequest, node.info, context);

	if (!node)
		return;

	if (flight.currentFlight?.flighting) {
		// TODO(afr): Ask user if they want to cancel existing, or cancel new

		return;
	}

	yield put(actions.beginFlightRequest({
		binaryStoreKey,
		requestId,
		flightId,
		request: preparedRequest,
		redirectDepth: 0,
	}));
}

async function prepareRequest(overview: RequestOverview, context: Context): Promise<RequestOverview> {
	const url = await convertRequestToUrl(context, overview);
	const headers = await flattenToggleValueParts(context, overview.headers);

	if (!hasHeader('user-agent', headers)) {
		headers[ksuid.generate('header').toString()] = {
			name: 'User-Agent',
			value: [`Beak/${windowSessionInstance.version ?? ''} (${windowSessionInstance.os})`],
			enabled: true,
		};
	}

	if (!hasHeader('content-type', headers)) {
		headers[ksuid.generate('header').toString()] = {
			name: 'Content-Type',
			value: [requestBodyContentType(overview.body)],
			enabled: true,
		};
	}

	return {
		...overview,
		url: [url.toString()],
		query: await flattenToggleValueParts(context, overview.query),
		headers,
		body: await flattenBody(context, overview.body),
	};
}

async function flattenToggleValueParts(context: Context, toggleValueParts: Record<string, ToggleKeyValue>) {
	const out: Record<string, ToggleKeyValue> = {};

	for (const key of TypedObject.keys(toggleValueParts)) {
		out[key] = {
			enabled: toggleValueParts[key].enabled,
			name: toggleValueParts[key].name,
			value: [await parseValueParts(context, toggleValueParts[key].value)],
		};
	}

	return out;
}

async function flattenBody(context: Context, body: RequestBody): Promise<RequestBodyText> {
	switch (body.type) {
		case 'text':
			return body;

		case 'json': {
			const json = await convertToRealJson(context, body.payload);

			return {
				type: 'text',
				payload: JSON.stringify(json),
			};
		}

		case 'url_encoded_form':
			return {
				type: 'text',
				payload: await convertKeyValueToString(context, body.payload),
			};

		default: return { type: 'text', payload: '' };
	}
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}
