/**
 * Normalise a raw tag list into a canonical form suitable for storage and
 * search: each tag is trimmed, lowercased, deduplicated, and empty strings
 * are dropped.
 *
 * Returns `undefined` when the resulting list would be empty so callers can
 * `delete workflow.tags` without an extra length check.
 *
 * Pure — no side-effects, no global state.
 */
export function normaliseWorkflowTags(raw: string[]): string[] | undefined {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const entry of raw) {
		const tag = entry.trim().toLowerCase();
		if (!tag || seen.has(tag)) continue;
		seen.add(tag);
		result.push(tag);
	}
	return result.length === 0 ? undefined : result;
}
