import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import ksuid from '@beak/ksuid';
import { convertKeyValueToString, convertStringToKeyValue } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToEntryJson, convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import actions from '@beak/ui/store/project/actions';
import type { RequestBodyTypeChangedPayload } from '@beak/ui/store/project/types';
import { attemptTextToJson } from '@beak/ui/utils/json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyType } from '@getbeak/types/request';

export function useChangeBodyType(node: ValidRequestNode) {
	const dispatch = useDispatch();
	const context = useVariableContext();
	const { body } = node.info;

	return useCallback(async (newType: RequestBodyType) => {
		if (newType === body.type)
			return;

		if (body.type !== 'text') {
			const result = await ipcDialogService.showMessageBox({
				title: 'Change body type?',
				message: 'Are you sure you want to change body type?',
				detail: newType === 'text'
					? 'Changing to text could cause data loss from disabled values!'
					: 'Changing editor will cause your existing body to be lost.',
				type: 'warning',
				buttons: ['Change', 'Cancel'],
				defaultId: 1,
				cancelId: 1,
			});

			if (result.response === 1)
				return;
		}

		// Changing from text to lang specific editor
		if (body.type === 'text') {
			if (newType === 'json') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'json',
					payload: convertToEntryJson(attemptTextToJson(body.payload)),
				}));
				return;
			}
			if (newType === 'url_encoded_form') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'url_encoded_form',
					payload: convertStringToKeyValue(body.payload, 'urlencodeditem'),
				}));
				return;
			}
			if (newType === 'graphql') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'graphql',
					payload: {
						query: body.payload,
						variables: { },
					},
				}));
				return;
			}
		}

		if (newType === 'json' && body.type === 'graphql') {
			dispatch(actions.requestBodyTypeChanged({
				requestId: node.id,
				type: 'json',
				payload: body.payload.variables,
			}));
			return;
		}

		if (newType === 'graphql' && body.type === 'json') {
			dispatch(actions.requestBodyTypeChanged({
				requestId: node.id,
				type: 'graphql',
				payload: {
					query: '',
					variables: body.payload,
				},
			}));
			return;
		}

		if (newType === 'text') {
			if (body.type === 'json') {
				const normalised = JSON.stringify(await convertToRealJson(context, body.payload), null, '\t');

				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: normalised === '""' ? '' : normalised,
				}));
				return;
			}
			if (body.type === 'url_encoded_form') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: await convertKeyValueToString(context, body.payload),
				}));
				return;
			}
			if (body.type === 'graphql') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: body.payload.query,
				}));
				return;
			}
		}

		dispatch(actions.requestBodyTypeChanged(createEmptyBodyPayload(node.id, newType)));
	}, [body, context, dispatch, node.id]);
}

function createEmptyBodyPayload(requestId: string, type: RequestBodyType): RequestBodyTypeChangedPayload {
	switch (type) {
		case 'url_encoded_form':
			return { requestId, type, payload: {} };

		case 'json': {
			const id = ksuid.generate('jsonentry').toString() as string;

			return {
				requestId,
				type,
				payload: {
					[id]: {
						id,
						parentId: null,
						type: 'object',
						enabled: true,
					},
				},
			};
		}

		case 'file':
			return { requestId, type, payload: { fileReferenceId: void 0, contentType: void 0 } };

		case 'graphql': {
			const id = ksuid.generate('jsonentry').toString() as string;

			return {
				requestId,
				type,
				payload: {
					query: '',
					variables: {
						[id]: {
							id,
							parentId: null,
							type: 'object',
							enabled: true,
						},
					},
				},
			};
		}

		default:
			return { requestId, type, payload: '' };
	}
}
