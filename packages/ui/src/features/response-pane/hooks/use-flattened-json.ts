import { useMemo } from 'react';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export interface JsonRow {
	id: string;
	path: string[];
	depth: number;
	keyKind: 'object-key' | 'array-index' | 'root';
	key: string | number | undefined;
	kind: 'primitive' | 'object-open' | 'object-close' | 'array-open' | 'array-close';
	value?: JsonPrimitive;
	valueType?: 'string' | 'number' | 'boolean' | 'null';
	childCount?: number;
	matchesSearch?: boolean;
}

interface Options {
	collapsed: Record<string, boolean>;
	searchTerm?: string;
}

function pathKey(path: string[]): string {
	return path.length === 0 ? '$' : `$.${path.join('.')}`;
}

function primitiveType(v: JsonPrimitive): 'string' | 'number' | 'boolean' | 'null' {
	if (v === null) return 'null';
	if (typeof v === 'number') return 'number';
	if (typeof v === 'boolean') return 'boolean';
	return 'string';
}

function matchesQuery(row: JsonRow, query: string): boolean {
	if (row.key !== undefined && String(row.key).toLowerCase().includes(query)) return true;
	if (row.value !== undefined && String(row.value).toLowerCase().includes(query)) return true;
	return false;
}

export function flattenJson(value: JsonValue, opts: Options): JsonRow[] {
	const out: JsonRow[] = [];
	const query = opts.searchTerm?.trim().toLowerCase() ?? '';

	function emit(row: JsonRow) {
		if (query.length > 0) row.matchesSearch = matchesQuery(row, query);
		out.push(row);
	}

	function walk(
		v: JsonValue,
		path: string[],
		depth: number,
		keyKind: JsonRow['keyKind'],
		key: string | number | undefined,
	) {
		const id = pathKey(path);

		if (Array.isArray(v)) {
			const isCollapsed = opts.collapsed[id] === true;

			emit({
				id,
				path,
				depth,
				keyKind,
				key,
				kind: 'array-open',
				childCount: v.length,
			});

			if (!isCollapsed) {
				for (let i = 0; i < v.length; i++) {
					walk(v[i], [...path, String(i)], depth + 1, 'array-index', i);
				}
				emit({
					id: `${id}::close`,
					path,
					depth,
					keyKind,
					key,
					kind: 'array-close',
					childCount: v.length,
				});
			}
		} else if (v !== null && typeof v === 'object') {
			const isCollapsed = opts.collapsed[id] === true;
			const keys = Object.keys(v);

			emit({
				id,
				path,
				depth,
				keyKind,
				key,
				kind: 'object-open',
				childCount: keys.length,
			});

			if (!isCollapsed) {
				for (const k of keys) {
					walk((v as { [k: string]: JsonValue })[k], [...path, k], depth + 1, 'object-key', k);
				}
				emit({
					id: `${id}::close`,
					path,
					depth,
					keyKind,
					key,
					kind: 'object-close',
					childCount: keys.length,
				});
			}
		} else {
			emit({
				id,
				path,
				depth,
				keyKind,
				key,
				kind: 'primitive',
				value: v as JsonPrimitive,
				valueType: primitiveType(v as JsonPrimitive),
			});
		}
	}

	walk(value, [], 0, 'root', undefined);

	if (query.length === 0) return out;

	// In search mode, retain only matching rows + their parent chains (so context
	// for a deep hit is visible). We compute the set of ancestor ids of every
	// matching primitive/key row and keep their open/close pairs.
	const keepIds = new Set<string>();
	for (const row of out) {
		if (row.matchesSearch) {
			for (let i = 0; i <= row.path.length; i++) {
				keepIds.add(pathKey(row.path.slice(0, i)));
				keepIds.add(`${pathKey(row.path.slice(0, i))}::close`);
			}
		}
	}

	if (keepIds.size === 0) return [];

	return out.filter(r => keepIds.has(r.id));
}

export default function useFlattenedJson(value: JsonValue | undefined, opts: Options): JsonRow[] {
	return useMemo(() => {
		if (value === undefined) return [];
		return flattenJson(value, opts);
	}, [value, opts.collapsed, opts.searchTerm]);
}
