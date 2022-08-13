import { instance as windowSessionInstance } from '@beak/app/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/app/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/realtime-values/parser';
import { ipcDialogService, ipcFsService } from '@beak/app/lib/ipc';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { FlightHistory } from '@getbeak/types/flight';
import type { Tree, ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBody, RequestBodyFile, RequestBodyText, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import type { VariableGroups } from '@getbeak/types/variable-groups';
import { call, put, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import * as actions from '../actions';
import { State } from '../types';

export default function* requestFlightWorker() {
	const binaryStoreKey = ksuid.generate('binstore').toString();
	const requestId: string = yield select((s: ApplicationState) => s.features.tabs.selectedTab);
	const flightId = ksuid.generate('flight').toString();

	const flight: State = yield select((s: ApplicationState) => s.global.flight);
	const node: ValidRequestNode = yield select((s: ApplicationState) => s.global.project.tree![requestId]);

	const projectTree: Tree = yield select(
		(s: ApplicationState) => s.global.project.tree,
	);
	const flightHistory: Record<string, FlightHistory> = yield select(
		(s: ApplicationState) => s.global.flight.flightHistory,
	);
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);
	const selectedGroups: Record<string, string> = yield select(
		(s: ApplicationState) => s.global.preferences.editor.selectedVariableGroups,
	);

	const context: Context = {
		selectedGroups,
		variableGroups,
		flightHistory,
		projectTree,
		currentRequestId: requestId,
	};

	const preparedRequest: RequestOverview = yield call(prepareRequest, node.info, context);

	if (!node)
		return;

	if (flight.currentFlight?.flighting) {
		// TODO(afr): Ask user if they want to cancel existing?
		yield call([ipcDialogService, ipcDialogService.showMessageBox], {
			title: 'Request already in flight',
			message: 'You already have a request currently in flight. You won\'t be able to run a new request until it has finished.',
			type: 'warning',
		});

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
		const contentType = requestBodyContentType(overview.body);

		if (contentType) {
			headers[ksuid.generate('header').toString()] = {
				name: 'Content-Type',
				value: [contentType],
				enabled: true,
			};
		}
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

	await Promise.all(TypedObject.keys(toggleValueParts).map(async k => {
		out[k] = {
			enabled: toggleValueParts[k].enabled,
			name: toggleValueParts[k].name,
			value: [await parseValueParts(context, toggleValueParts[k].value)],
		};
	}));

	return out;
}

async function flattenBody(context: Context, body: RequestBody): Promise<RequestBodyText | RequestBodyFile> {
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

		case 'file': {
			try {
				const response = await ipcFsService.readReferencedFile(body.payload.fileReferenceId!);

				return {
					type: 'file',
					payload: {
						...body.payload,
						__hacky__binaryFileData: response.body,
					},
				};
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('unable to read reference file', error);

				return { type: 'text', payload: '' };
			}
		}

		default: throw new Error('unknown_body_type');
	}
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}
