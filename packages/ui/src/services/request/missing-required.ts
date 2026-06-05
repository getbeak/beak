import { TypedObject } from '@beak/common/helpers/typescript';
import { entryMap, valueParts } from '@beak/state';
import type { ValidRequestNode } from '@getbeak/types/nodes';

/**
 * Walk a request's schema-flagged fields and count the ones that are
 * required-but-empty. Returns a structured summary so different surfaces
 * can use whichever bit they need: the body-tab badge shows
 * `bodyMissing`, the Send button shows `count`, the pre-flight dialog
 * shows `scopes` for the "needs values: Headers, Params, Body" copy.
 *
 * Previously Header and Modifiers had near-duplicate inline walkers;
 * `Modifiers.tsx`'s comment literally said "Mirror of …" — exactly the
 * cross-component drift this consolidation prevents.
 */

export interface MissingRequiredSummary {
	/** Total required-but-empty across every scope. */
	count: number;
	/** Scope labels that contributed at least one missing field. */
	scopes: string[];
	/** Per-scope counts; missing keys are zero. */
	perScope: {
		headers: number;
		query: number;
		body: number;
	};
}

const SCOPE_LABEL = { headers: 'Headers', query: 'Params', body: 'Body' } as const;

const ZERO: MissingRequiredSummary = {
	count: 0,
	scopes: [],
	perScope: { headers: 0, query: 0, body: 0 },
};

/**
 * Compute the summary for a request. Pure: depends only on the node's
 * `info` shape and the value-parts / entry-map helpers — no Redux read,
 * no IPC. Caller memoises if it wants stability across renders.
 */
export function summarizeMissingRequired(node: ValidRequestNode): MissingRequiredSummary {
	const result = { ...ZERO, perScope: { ...ZERO.perScope } };

	for (const h of TypedObject.values(node.info.headers)) {
		if (h.required === true && h.enabled !== false && valueParts.isEmpty(h.value)) result.perScope.headers++;
	}
	for (const q of TypedObject.values(node.info.query)) {
		if (q.required === true && q.enabled !== false && valueParts.isEmpty(q.value)) result.perScope.query++;
	}
	const body = node.info.body;
	if (body) {
		if (body.type === 'json') {
			result.perScope.body += entryMap.countWhere(
				body.payload,
				e => e.required === true && e.enabled !== false && entryMap.isEntryValueEmpty(e, valueParts.isEmpty),
			);
		} else if (body.type === 'url_encoded_form') {
			for (const item of TypedObject.values(body.payload)) {
				if (item.required === true && item.enabled !== false && valueParts.isEmpty(item.value)) result.perScope.body++;
			}
		} else if (body.type === 'graphql') {
			result.perScope.body += entryMap.countWhere(
				body.payload.variables,
				e => e.required === true && e.enabled !== false && entryMap.isEntryValueEmpty(e, valueParts.isEmpty),
			);
		}
	}

	const scopes: string[] = [];
	let count = 0;
	for (const key of ['headers', 'query', 'body'] as const) {
		const n = result.perScope[key];
		if (n > 0) {
			scopes.push(SCOPE_LABEL[key]);
			count += n;
		}
	}

	result.count = count;
	result.scopes = scopes;
	return result;
}
