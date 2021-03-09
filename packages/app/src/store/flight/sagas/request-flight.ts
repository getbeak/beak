import { convertKeyValueToString } from '@beak/app/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/variable-input/parser';
import { getGlobal } from '@beak/app/globals';
import binaryStore from '@beak/app/lib/binary-store';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import {
	RequestBody,
	RequestBodyText,
	RequestNode,
	RequestOverview,
	ToggleKeyValue,
	VariableGroups,
} from '@beak/common/dist/types/beak-project';
import { TypedObject } from '@beak/common/helpers/typescript';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { call, put, select } from 'redux-saga/effects';

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
	const preparedRequest: RequestOverview = yield call(prepareRequest, node.info, selectedGroups, variableGroups);

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

async function prepareRequest(
	overview: RequestOverview,
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
): Promise<RequestOverview> {
	const url = convertRequestToUrl(selectedGroups, variableGroups, overview);
	const headers = await flattenToggleValueParts(overview.headers, selectedGroups, variableGroups);

	// if (!hasHeader('host', headers)) {
	// 	headers[ksuid.generate('header').toString()] = {
	// 		name: 'Host',
	// 		value: [`${url.hostname}${url.port ? `:${url.port}` : ''}`],
	// 		enabled: true,
	// 	};
	// }

	if (!hasHeader('user-agent', headers)) {
		headers[ksuid.generate('header').toString()] = {
			name: 'User-Agent',
			value: [`Beak/${getGlobal('version') ?? ''} (${getGlobal('os')})`],
			enabled: true,
		};
	}

	return {
		...overview,
		url: [url.toString()],
		query: await flattenToggleValueParts(overview.query, selectedGroups, variableGroups),
		headers,
		body: await flattenBody(selectedGroups, variableGroups, overview.body),
	};
}

async function flattenToggleValueParts(
	toggleValueParts: Record<string, ToggleKeyValue>,
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
) {
	const out: Record<string, ToggleKeyValue> = {};

	for (const key of TypedObject.keys(toggleValueParts)) {
		out[key].enabled = toggleValueParts[key].enabled;
		out[key].name = toggleValueParts[key].name;
		out[key].value = [await parseValueParts(selectedGroups, variableGroups, toggleValueParts[key].value)];
	}

	return out;
}

async function flattenBody(
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
	body: RequestBody,
): Promise<RequestBodyText> {
	switch (body.type) {
		case 'text':
			return body;

		case 'json': {
			const json = await convertToRealJson(selectedGroups, variableGroups, body.payload);

			return {
				type: 'text',
				payload: JSON.stringify(json),
			};
		}

		case 'url_encoded_form':
			return {
				type: 'text',
				payload: await convertKeyValueToString(selectedGroups, variableGroups, body.payload),
			};

		default: return { type: 'text', payload: 'body type not supported' };
	}
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}
