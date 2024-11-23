import React, { useContext, useEffect, useState } from 'react';
import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import EditorView from '@beak/ui/components/atoms/EditorView';
import WindowSessionContext, { WindowSession } from '@beak/ui/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/ui/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/ui/features/json-editor/parsers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import useComponentMounted from '@beak/ui/hooks/use-component-mounted';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { useAppSelector } from '@beak/ui/store/redux';
import { requestAllowsBody } from '@beak/ui/utils/http';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBody, RequestOverview, ToggleKeyValue } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';

export interface RequestOutputProps {
	selectedNode: ValidRequestNode;
}

const RequestOutput: React.FC<React.PropsWithChildren<RequestOutputProps>> = props => {
	const node = props.selectedNode;
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const windowSession = useContext(WindowSessionContext);
	const [output, setOutput] = useState('');
	const mounted = useComponentMounted();
	const context = useVariableContext(node.id);

	useEffect(() => {
		createBasicHttpOutput(node.info, context, windowSession)
			.then(response => {
				if (!mounted)
					return;

				setOutput(response);
			});
	}, [node, selectedGroups, variableSets]);

	return (
		<EditorView
			language={'http'}
			value={output}
			options={{ readOnly: true }}
		/>
	);
};

function createBodySection(verb: string, body: RequestBody) {
	if (!requestAllowsBody(verb))
		return null;

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

export async function createBasicHttpOutput(overview: RequestOverview, context: Context, windowSession: WindowSession) {
	const url = await convertRequestToUrl(context, overview);
	const { headers, verb, body } = overview;
	const firstLine = [
		`${verb.toUpperCase()} `,
		url.pathname,
	];

	const queryBuilder = new URLSearchParams();

	await Promise.all(TypedObject
		.values(overview.query)
		.filter(q => q.enabled)
		.map(async value => queryBuilder.append(value.name, await parseValueSections(context, value.value))),
	);

	if (!requestAllowsBody(verb) && body.type === 'graphql')
		queryBuilder.append('query', body.payload.query);

	if (queryBuilder.values.length > 0)
		firstLine.push(`?${queryBuilder.toString()}`);

	if (url.hash)
		firstLine.push(url.hash);

	const out = [`${firstLine.join('')} HTTP/1.1`];

	if (!hasHeader('host', headers))
		out.push(`Host: ${url.hostname}${url.port ? `:${url.port}` : ''}`);

	if (!hasHeader('connection', headers))
		out.push('Connection: close');

	if (!hasHeader('accept', headers))
		out.push('Accept: */*');

	if (!hasHeader('user-agent', headers))
		out.push(`User-Agent: Beak/${windowSession.version ?? ''} (${windowSession.os})`);

	if (headers) {
		out.push(...(await Promise.all(
			TypedObject.values(headers)
				.filter(h => h.enabled)
				.map(async ({ name, value }) => `${name}: ${await parseValueSections(context, value)}`))),
		);
	}

	const bodyOut = createBodySection(verb, body);

	if (bodyOut !== null) {
		const hasContentTypeHeader = TypedObject.values(headers)
			.map(h => h.name.toLocaleLowerCase())
			.find(h => h === 'content-type');

		if (!hasContentTypeHeader) {
			const contentType = requestBodyContentType(body);

			if (contentType)
				out.push(`Content-Type: ${contentType}`);
		}

		// Padding between headers/body
		out.push('');

		if (body.type === 'json') {
			out.push(JSON.stringify(await convertToRealJson(context, body.payload), null, '\t'));
		} else if (body.type === 'text') {
			out.push(body.payload);
		} else if (body.type === 'url_encoded_form') {
			out.push(await convertKeyValueToString(context, body.payload));
		} else if (body.type === 'file') {
			out.push(await readReferencedFile(body.payload.fileReferenceId));
		} else if (!requestAllowsBody(verb) && body.type === 'graphql') {
			// Do nothing here, the graphql body on a get/head is set in the query
		} else if (requestAllowsBody(verb) && body.type === 'graphql') {
			out.push(JSON.stringify({
				query: body.payload.query,
				variables: await convertToRealJson(context, body.payload.variables),
			}, null, '\t'));
		} else {
			out.push('[Unknown body type]');
		}
	}

	return out.join('\n');
}

async function readReferencedFile(fileReferenceId: string | undefined) {
	if (!fileReferenceId)
		return '';

	try {
		const response = await ipcFsService.readReferencedFile(fileReferenceId, 1000);
		const decoded = new TextDecoder().decode(response.body);

		return decoded;
	} catch {
		return '';
	}
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}

export default RequestOutput;
