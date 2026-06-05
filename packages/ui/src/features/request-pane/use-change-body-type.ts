import ksuid from '@beak/ksuid';
import { type BodyTransitionDeps, transitionBody } from '@beak/state/requests';
import { convertKeyValueToString, convertStringToKeyValue } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToEntryJson, convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import { useSourceSchemas } from '@beak/ui/features/source-schemas/hooks/use-source-schemas';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import actions from '@beak/ui/store/project/actions';
import { attemptTextToJson } from '@beak/ui/utils/json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBody, RequestBodyType } from '@getbeak/types/request';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Body-type-change orchestrator. The pure transition table lives in
 * `@beak/state/requests/body-type-transitions`; this hook owns the two
 * UI-flavoured concerns the pure module can't:
 *
 *  1. The "use a schema source for GraphQL?" dialog when switching to a
 *     GraphQL body — needs to read the registered-sources count and
 *     dispatch a sidebar-switch on confirm.
 *  2. The "you'll lose your body" confirmation when leaving anything
 *     other than text. Both are blocking `ipcDialogService` round trips.
 *
 * After the dialogs gate, the hook calls `transitionBody` and dispatches
 * the resulting body verbatim.
 */
export function useChangeBodyType(node: ValidRequestNode) {
	const dispatch = useDispatch();
	const context = useVariableContext();
	const { body } = node.info;
	// Hook-level visibility into registered GraphQL schema sources so the
	// switch-to-GraphQL prompt can adapt its CTA to "pick one" vs.
	// "register one" depending on whether any exist project-wide.
	const graphql = useSourceSchemas('graphql');
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
				const secondButton = hasSources ? `Pick a schema source (${graphqlSourceCount})` : 'Register a schema source';
				const detail = hasSources
					? 'A schema source introspects the endpoint so Beak can autocomplete fields, type-check variables, and validate the query as you type.\n\nAd-hoc skips the schema — pick this for one-off queries or scratch work.'
					: "A schema source introspects the endpoint so Beak can autocomplete fields, type-check variables, and validate the query as you type. You don't have any registered yet — register one to unlock these features for this and every other GraphQL request in the project.\n\nAd-hoc skips the schema — pick this for one-off queries or scratch work.";
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

			const next = await transitionBody(body, newType, context, buildDeps());
			dispatchTransitioned(dispatch, node.id, next);
		},
		[body, context, dispatch, node.id, graphqlSourceCount],
	);
}

/**
 * Wire the renderer-side helpers (variable-resolution + JSON / form
 * parsers + KSUID) into the pure transition module. Built fresh per
 * call so the function captures the current renderer modules without
 * caring whether the caller is in a React render path.
 */
function buildDeps(): BodyTransitionDeps {
	return {
		convertToRealJson,
		convertKeyValueToString,
		generateEntryId: () => ksuid.generate('jsonentry').toString(),
		textToEntryJson: text => convertToEntryJson(attemptTextToJson(text)),
		textToUrlEncodedForm: text => convertStringToKeyValue(text, 'urlencodeditem'),
	};
}

/**
 * Adapt the pure `RequestBody` return value back onto the Redux action
 * shape, which is discriminated on `{ requestId, type, payload }`. The
 * cast is safe because `RequestBody`'s discriminator matches the
 * action payload's exactly — TypeScript can't follow the structural
 * equivalence across the boundary so we narrow the dispatch instead.
 */
function dispatchTransitioned(dispatch: ReturnType<typeof useDispatch>, requestId: string, body: RequestBody): void {
	dispatch(actions.requestBodyTypeChanged({ requestId, ...body } as never));
}
