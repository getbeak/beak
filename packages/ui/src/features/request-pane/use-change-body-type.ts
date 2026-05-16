import ksuid from '@beak/ksuid';
import { convertKeyValueToString, convertStringToKeyValue } from '@beak/ui/features/basic-table-editor/parsers';
import { useEndpoints } from '@beak/ui/features/endpoints/hooks/use-endpoints';
import { convertToEntryJson, convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import actions from '@beak/ui/store/project/actions';
import type { RequestBodyTypeChangedPayload } from '@beak/ui/store/project/types';
import { attemptTextToJson } from '@beak/ui/utils/json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyType } from '@getbeak/types/request';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export function useChangeBodyType(node: ValidRequestNode) {
	const dispatch = useDispatch();
	const context = useVariableContext();
	const { body } = node.info;
	// Hook-level visibility into registered GraphQL schema sources so the
	// switch-to-GraphQL prompt can adapt its CTA to "pick one" vs.
	// "register one" depending on whether any exist project-wide.
	const graphql = useEndpoints('graphql');
	const graphqlSourceCount = graphql.entries.length;

	return useCallback(
		async (newType: RequestBodyType) => {
			if (newType === body.type) return;
			// Defensive: the body-type picker never offers gRPC, but if a
			// stray callsite ever asks for it we bail rather than producing
			// a malformed body.
			if (newType === 'grpc') return;

			// Switching TO GraphQL: nudge the user toward a registered schema
			// source. Sources are project-wide — any request can target any
			// one. The CTA flexes on what exists: when nothing is registered,
			// the second button registers; when sources already exist, it
			// jumps into the sidebar to pick or manage.
			if (newType === 'graphql' && body.type !== 'graphql') {
				const hasSources = graphqlSourceCount > 0;
				const secondButton = hasSources
					? `Pick a schema source (${graphqlSourceCount})`
					: 'Register a schema source';
				const detail = hasSources
					? 'A schema source introspects the endpoint so Beak can autocomplete fields, type-check variables, and validate the query as you type.\n\nAd-hoc skips the schema — pick this for one-off queries or scratch work.'
					: 'A schema source introspects the endpoint so Beak can autocomplete fields, type-check variables, and validate the query as you type. You don\'t have any registered yet — register one to unlock these features for this and every other GraphQL request in the project.\n\nAd-hoc skips the schema — pick this for one-off queries or scratch work.';
				const result = await ipcDialogService.showMessageBox({
					title: 'Use GraphQL body',
					message: 'Use a schema source, or write an ad-hoc query?',
					detail,
					type: 'question',
					buttons: ['Ad-hoc', secondButton, 'Cancel'],
					defaultId: 0,
					cancelId: 2,
				});
				if (result.response === 2) return;
				if (result.response === 1) {
					dispatch(sidebarPreferenceSetSelected('schemas'));
					return;
				}
				// response === 0 → continue with the ad-hoc switch.
			}

			if (body.type !== 'text') {
				const result = await ipcDialogService.showMessageBox({
					title: 'Change body type?',
					message: 'Are you sure you want to change body type?',
					detail:
						newType === 'text'
							? 'Changing to text could cause data loss from disabled values!'
							: 'Changing editor will cause your existing body to be lost.',
					type: 'warning',
					buttons: ['Change', 'Cancel'],
					defaultId: 1,
					cancelId: 1,
				});

				if (result.response === 1) return;
			}

			// Changing from text to lang specific editor
			if (body.type === 'text') {
				if (newType === 'json') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'json',
							payload: convertToEntryJson(attemptTextToJson(body.payload)),
						}),
					);
					return;
				}
				if (newType === 'json_raw') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'json_raw',
							payload: body.payload,
						}),
					);
					return;
				}
				if (newType === 'url_encoded_form') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'url_encoded_form',
							payload: convertStringToKeyValue(body.payload, 'urlencodeditem'),
						}),
					);
					return;
				}
				if (newType === 'graphql') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'graphql',
							payload: {
								query: body.payload,
								variables: {},
							},
						}),
					);
					return;
				}
			}

			// json_raw ↔ json: parse/stringify when going either way. If the raw
			// text is invalid JSON when leaving raw mode, fall back to an empty
			// structured object — the user already saw the parse failure during
			// editing (or chose to leave it broken on purpose).
			if (body.type === 'json_raw' && newType === 'json') {
				let parsed: Record<string, unknown> | unknown[] | string | number | boolean | null = {};
				try {
					parsed = JSON.parse(body.payload || '{}');
				} catch {
					/* keep parsed = {} */
				}
				dispatch(
					actions.requestBodyTypeChanged({
						requestId: node.id,
						type: 'json',
						payload: convertToEntryJson(parsed),
					}),
				);
				return;
			}

			if (body.type === 'json' && newType === 'json_raw') {
				const real = await convertToRealJson(context, body.payload);
				dispatch(
					actions.requestBodyTypeChanged({
						requestId: node.id,
						type: 'json_raw',
						payload: JSON.stringify(real, null, '\t'),
					}),
				);
				return;
			}

			// json_raw → text: just lift the string straight across.
			if (body.type === 'json_raw' && newType === 'text') {
				dispatch(
					actions.requestBodyTypeChanged({
						requestId: node.id,
						type: 'text',
						payload: body.payload,
					}),
				);
				return;
			}

			if (newType === 'json' && body.type === 'graphql') {
				dispatch(
					actions.requestBodyTypeChanged({
						requestId: node.id,
						type: 'json',
						payload: body.payload.variables,
					}),
				);
				return;
			}

			if (newType === 'graphql' && body.type === 'json') {
				dispatch(
					actions.requestBodyTypeChanged({
						requestId: node.id,
						type: 'graphql',
						payload: {
							query: '',
							variables: body.payload,
						},
					}),
				);
				return;
			}

			if (newType === 'text') {
				if (body.type === 'json') {
					const normalised = JSON.stringify(await convertToRealJson(context, body.payload), null, '\t');

					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'text',
							payload: normalised === '""' ? '' : normalised,
						}),
					);
					return;
				}
				if (body.type === 'url_encoded_form') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'text',
							payload: await convertKeyValueToString(context, body.payload),
						}),
					);
					return;
				}
				if (body.type === 'graphql') {
					dispatch(
						actions.requestBodyTypeChanged({
							requestId: node.id,
							type: 'text',
							payload: body.payload.query,
						}),
					);
					return;
				}
			}

			dispatch(actions.requestBodyTypeChanged(createEmptyBodyPayload(node.id, newType)));
		},
		[body, context, dispatch, node.id, graphqlSourceCount],
	);
}

// `RequestBodyType` includes `'grpc'`, but gRPC requests aren't created
// through this body-type-changed flow (Discover writes them directly). We
// narrow the input here so the type checker can prove the default branch
// covers every remaining variant.
type SwitchableBodyType = Exclude<RequestBodyType, 'grpc'>;

function createEmptyBodyPayload(requestId: string, type: SwitchableBodyType): RequestBodyTypeChangedPayload {
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
