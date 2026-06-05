import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import EditorView from '@beak/ui/components/atoms/EditorView';
import WindowSessionContext, { type WindowSession } from '@beak/ui/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import { ipcAssetsService, ipcFsService } from '@beak/ui/lib/ipc';
import { resolveAssetBytes } from '@beak/ui/services/assets/resolve';
import { convertRequestToUrl } from '@beak/ui/services/url';
import { useAppSelector } from '@beak/ui/store/redux';
import { requestAllowsBody } from '@beak/ui/utils/http';
import { contentTypeToMonacoLanguage } from '@beak/ui/utils/monaco';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBody, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import React, { useContext, useEffect, useState } from 'react';

export interface RequestOutputProps {
	selectedNode: ValidRequestNode;
}

interface SplitOutput {
	head: string;
	body: string;
	/** Monaco language id for the body editor — already falls back to 'text'. */
	bodyLanguage: string;
	/** Resolved Content-Type used to pick the body language; shown in the divider. */
	contentType: string | null;
}

const EMPTY_SPLIT: SplitOutput = { head: '', body: '', bodyLanguage: 'text', contentType: null };

const RequestOutput: React.FC<React.PropsWithChildren<RequestOutputProps>> = props => {
	const node = props.selectedNode;
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const windowSession = useContext(WindowSessionContext);
	const [output, setOutput] = useState<SplitOutput>(EMPTY_SPLIT);
	const context = useVariableContext(node.id);

	useEffect(() => {
		let cancelled = false;
		createSplitHttpOutput(node.info, context, windowSession).then(response => {
			if (!cancelled) setOutput(response);
		});
		return () => {
			cancelled = true;
		};
	}, [node, selectedSets, variableSets]);

	// Render head + body in ONE Monaco editor so the user can copy-paste the
	// whole thing in one swipe. The custom `http` monarch tokenizer
	// (utils/monaco.ts) inspects the Content-Type header during tokenization
	// and transitions into an embedded language for the body section — so a
	// JSON body still highlights as JSON, an XML body as XML, etc., without
	// needing two separate editors stacked.
	const combined = output.body.length === 0 ? output.head : `${output.head}\n\n${output.body}`;

	return <EditorView language={'http'} value={combined} options={{ readOnly: true }} />;
};

function createBodySection(verb: string, body: RequestBody) {
	if (!requestAllowsBody(verb)) return null;

	switch (body.type) {
		case 'text':
		case 'json':
		case 'graphql':
		case 'url_encoded_form':
			return body.payload;

		default:
			return `preview not supported for ${body.type}`;
	}
}

/**
 * Render the full HTTP preview as one blob — used by callers that copy the
 * preview to the clipboard or stuff it into a flight history pane. New
 * inline rendering should reach for `createSplitHttpOutput` instead so the
 * body can be highlighted by content-type.
 */
export async function createBasicHttpOutput(overview: RequestOverview, context: Context, windowSession: WindowSession) {
	const split = await createSplitHttpOutput(overview, context, windowSession);
	if (split.body.length === 0) return split.head;
	return `${split.head}\n\n${split.body}`;
}

/**
 * Two-region variant of the HTTP preview: head (request line + headers,
 * Monaco-language `http`) separated from body (Monaco language picked from
 * the resolved Content-Type). The split is what lets the inline preview
 * colourise the body — JSON gets JSON tokens, XML gets XML tokens, etc.
 *
 * The body language is resolved from the explicit Content-Type header
 * first, falling back to the body-type's natural mime (JSON body without a
 * declared header still highlights as JSON). Unknown / no content-type
 * yields `text` so the body still renders, just without colours.
 */
export async function createSplitHttpOutput(
	overview: RequestOverview,
	context: Context,
	windowSession: WindowSession,
): Promise<SplitOutput> {
	const url = await convertRequestToUrl(context, overview);
	const { headers, verb, body } = overview;
	const firstLine = [`${verb.toUpperCase()} `, url.pathname];

	const queryBuilder = new URLSearchParams();

	await Promise.all(
		TypedObject.values(overview.query)
			.filter(q => q.enabled)
			.map(async value => queryBuilder.append(value.name, await parseValueSections(context, value.value))),
	);

	if (!requestAllowsBody(verb) && body.type === 'graphql') queryBuilder.append('query', body.payload.query);

	const queryString = queryBuilder.toString();
	if (queryString.length > 0) firstLine.push(`?${queryString}`);

	if (url.hash) firstLine.push(url.hash);

	const headLines: string[] = [`${firstLine.join('')} HTTP/1.1`];

	if (!hasHeader('host', headers)) headLines.push(`Host: ${url.hostname}${url.port ? `:${url.port}` : ''}`);
	if (!hasHeader('connection', headers)) headLines.push('Connection: close');
	if (!hasHeader('accept', headers)) headLines.push('Accept: */*');
	if (!hasHeader('user-agent', headers))
		headLines.push(`User-Agent: Beak/${windowSession.version ?? ''} (${windowSession.os})`);

	if (headers) {
		headLines.push(
			...(await Promise.all(
				TypedObject.values(headers)
					.filter(h => h.enabled)
					.map(async ({ name, value }) => `${name}: ${await parseValueSections(context, value)}`),
			)),
		);
	}

	const bodyOut = createBodySection(verb, body);
	let resolvedContentType: string | null = readLiteralContentTypeHeader(headers);

	if (bodyOut !== null) {
		if (!resolvedContentType) {
			const inferred = requestBodyContentType(body);
			if (inferred) {
				headLines.push(`Content-Type: ${inferred}`);
				resolvedContentType = inferred;
			}
		}
	}

	const bodyLanguage = contentTypeToMonacoLanguage(resolvedContentType) ?? 'text';

	let bodyText = '';
	if (bodyOut !== null) {
		if (body.type === 'json') {
			bodyText = JSON.stringify(await convertToRealJson(context, body.payload), null, '\t');
		} else if (body.type === 'json_raw') {
			bodyText = body.payload;
		} else if (body.type === 'text') {
			bodyText = body.payload;
		} else if (body.type === 'url_encoded_form') {
			bodyText = await convertKeyValueToString(context, body.payload);
		} else if (body.type === 'file') {
			bodyText = await readFileBody(body.payload);
		} else if (!requestAllowsBody(verb) && body.type === 'graphql') {
			bodyText = '';
		} else if (requestAllowsBody(verb) && body.type === 'graphql') {
			bodyText = JSON.stringify(
				{
					query: body.payload.query,
					variables: await convertToRealJson(context, body.payload.variables),
				},
				null,
				'\t',
			);
		} else {
			bodyText = '[Unknown body type]';
		}
	}

	return {
		head: headLines.join('\n'),
		body: bodyText,
		bodyLanguage,
		contentType: resolvedContentType,
	};
}

/**
 * Pull the first enabled Content-Type header value out of the request, but
 * only when it's a plain string (no variable references). Variable values
 * resolve at flight time, not here — picking a Monaco language off them
 * would be guessing. Returns null when no usable header exists.
 */
function readLiteralContentTypeHeader(headers: Record<string, ToggleKeyValue>): string | null {
	const match = TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === 'content-type');
	if (!match) return null;
	const parts = match.value;
	if (parts.length !== 1 || typeof parts[0] !== 'string') return null;
	return parts[0];
}

/**
 * Pull the file body's bytes for the preview pane. Uses the same
 * assetRef → fileReferenceId resolution rule the flight prep uses, so a
 * preview of an asset-based body shows the actual contents instead of
 * being silently empty (the bug fixed in B6).
 */
async function readFileBody(payload: {
	assetRef?: { sha256: string; size: number; contentType?: string };
	fileReferenceId?: string;
}) {
	const result = await resolveAssetBytes(payload, {
		readAsset: async ref => {
			const res = await ipcAssetsService.read({ ref });
			if (!res.bytes) return null;
			return { body: res.bytes };
		},
		readReferencedFile: id => ipcFsService.readReferencedFile(id, 1000),
	});
	if (result.kind === 'asset' || result.kind === 'file') return new TextDecoder().decode(result.bytes);
	return '';
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}

export default RequestOutput;
