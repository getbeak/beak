import React, { useContext, useEffect, useState } from 'react';
import WindowSessionContext, { WindowSession } from '@beak/app-beak/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/app-beak/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app-beak/features/json-editor/parsers';
import useRealtimeValueContext from '@beak/app-beak/features/realtime-values/hooks/use-realtime-value-context';
import { parseValueParts } from '@beak/app-beak/features/realtime-values/parser';
import { Context } from '@beak/app-beak/features/realtime-values/types';
import useComponentMounted from '@beak/app-beak/hooks/use-component-mounted';
import { useAppSelector } from '@beak/app-beak/store/redux';
import { createDefaultOptions } from '@beak/app-beak/utils/monaco';
import { convertRequestToUrl } from '@beak/app-beak/utils/uri';
import { requestBodyContentType } from '@beak/shared-common/helpers/request';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import { RequestBody, RequestOverview, ToggleKeyValue, ValidRequestNode } from '@beak/shared-common/types/beak-project';
import Editor from '@monaco-editor/react';

const bodyFreeVerbs = ['get', 'head'];

export interface RequestOutputProps {
	selectedNode: ValidRequestNode;
}

const RequestOutput: React.FC<React.PropsWithChildren<RequestOutputProps>> = props => {
	const node = props.selectedNode;
	const variableGroups = useAppSelector(s => s.global.variableGroups.variableGroups);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const windowSession = useContext(WindowSessionContext);
	const [output, setOutput] = useState('');
	const mounted = useComponentMounted();
	const context = useRealtimeValueContext(node.id);

	useEffect(() => {
		createBasicHttpOutput(node.info, context, windowSession)
			.then(response => {
				if (!mounted)
					return;

				setOutput(response);
			});
	}, [node, selectedGroups, variableGroups]);

	return (
		<Editor
			height={'100%'}
			width={'100%'}
			language={'http'}
			theme={'vs-dark'}
			value={output}
			options={{
				...createDefaultOptions(),
				readOnly: true,
			}}
		/>
	);
};

function createBodySection(verb: string, body: RequestBody) {
	if (bodyFreeVerbs.includes(verb))
		return null;

	switch (body.type) {
		case 'text':
		case 'json':
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

	if (overview.query && TypedObject.keys(overview.query).length > 0) {
		const builder = new URLSearchParams();

		for (const { name, value } of TypedObject.values(overview.query).filter(q => q.enabled))
			builder.append(name, await parseValueParts(context, value));

		firstLine.push(`?${builder.toString()}`);
	}

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
				.map(async ({ name, value }) => `${name}: ${await parseValueParts(context, value)}`))),
		);
	}

	const bodyOut = createBodySection(verb, body);

	if (bodyOut !== null) {
		const hasContentTypeHeader = TypedObject.values(headers)
			.map(h => h.name.toLocaleLowerCase())
			.find(h => h === 'content-type');

		if (!hasContentTypeHeader) {
			const contentType = requestBodyContentType(body);

			out.push(`Content-Type: ${contentType}`);
		}

		// Padding between headers/body
		out.push('');

		if (body.type === 'json')
			out.push(JSON.stringify(await convertToRealJson(context, body.payload), null, '\t'));
		else if (body.type === 'text')
			out.push(body.payload);
		else if (body.type === 'url_encoded_form')
			out.push(await convertKeyValueToString(context, body.payload));
		else
			out.push('[Unknown body type]');
	}

	return out.join('\n');
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}

export default RequestOutput;
