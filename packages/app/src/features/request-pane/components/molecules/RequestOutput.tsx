import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { convertKeyValueToString } from '@beak/app/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/variable-input/parser';
import { Context } from '@beak/app/features/variable-input/realtime-values/types';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestBody, RequestNode, RequestOverview, ToggleKeyValue } from '@beak/common/types/beak-project';
import { getGlobal } from '@electron/remote';
import React, { useContext, useEffect, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useSelector } from 'react-redux';

const bodyFreeVerbs = ['get', 'head'];

export interface RequestOutputProps {
	selectedNode: RequestNode;
}

const RequestOutput: React.FunctionComponent<RequestOutputProps> = props => {
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const [output, setOutput] = useState('');
	const context = { projectPath, selectedGroups, variableGroups };

	useEffect(() => {
		createBasicHttpOutput(props.selectedNode.info, context).then(setOutput);
	}, [props.selectedNode.info, selectedGroups, variableGroups]);

	return (
		<React.Fragment>
			<MonacoEditor
				height={'100%'}
				width={'100%'}
				language={'javascript'}
				theme={'vs-dark'}
				value={output}
				options={{
					...createDefaultOptions(),
					readOnly: true,
				}}
			/>
		</React.Fragment>
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

export async function createBasicHttpOutput(overview: RequestOverview, context: Context) {
	const windowSession = useContext(WindowSessionContext);
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
		out.push(...await Promise.all(
			TypedObject.values(headers)
				.filter(h => h.enabled)
				.map(async ({ name, value }) => `${name}: ${await parseValueParts(context, value)}`)),
		);
	}

	const bodyOut = createBodySection(verb, body);

	if (bodyOut !== null) {
		const hasContentTypeHeader = TypedObject.keys(headers)
			.map(h => h.toLocaleLowerCase())
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
