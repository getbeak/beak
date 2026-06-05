/**
 * Centralised registry of every KSUID prefix the codebase emits.
 *
 * Each entity type that gets a synthesised id picks a prefix here so the
 * full set is visible in one place and typos are caught at compile time.
 * Use {@link KsuidKind} as the parameter type when you accept a prefix
 * from another module — see `flight.ts`'s `generateId(kind)` and
 * `prepareRequest`'s `Deps['generateId']`.
 *
 * Adding a new entity type: extend the constant + the union. Don't
 * inline a new prefix string in feature code.
 */
export const KSUID_PREFIXES = {
	alert: 'alert',
	binstore: 'binstore',
	ctxmenu: 'ctxmenu',
	edge: 'edge',
	extcall: 'extcall',
	failedrequest: 'failedrequest',
	fileref: 'fileref',
	flight: 'flight',
	fswatch: 'fswatch',
	header: 'header',
	item: 'item',
	jsonentry: 'jsonentry',
	node: 'node',
	project: 'project',
	prvval: 'prvval',
	query: 'query',
	request: 'request',
	rtvparsersp: 'rtvparsersp',
	set: 'set',
	socket: 'socket',
	test: 'test',
	urlencodeditem: 'urlencodeditem',
	workflow: 'workflow',
} as const;

export type KsuidKind = (typeof KSUID_PREFIXES)[keyof typeof KSUID_PREFIXES];
