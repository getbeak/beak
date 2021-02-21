import { convertKeyValueToString } from '@beak/app/features/basic-table-editor/parsers';
import { convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { parseValueParts } from '@beak/app/features/variable-input/parser';
import { getGlobal } from '@beak/app/globals';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { requestBodyContentType } from '@beak/common/helpers/request';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestBody, RequestNode, RequestOverview, ToggleKeyValue, VariableGroups } from '@beak/common/types/beak-project';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useSelector } from 'react-redux';

const bodyFreeVerbs = ['get', 'head'];

export interface RequestOutputProps {
	selectedNode: RequestNode;
}

const RequestOutput: React.FunctionComponent<RequestOutputProps> = props => {
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups!);
	const code = createBasicHttpOutput(props.selectedNode.info, selectedGroups, variableGroups!);

	return (
		<React.Fragment>
			<MonacoEditor
				height={'100%'}
				width={'100%'}
				language={'javascript'}
				theme={'vs-dark'}
				value={code}
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

export function createBasicHttpOutput(
	overview: RequestOverview,
	selectedGroups: Record<string, string>,
	variableGroups: VariableGroups,
) {
	const url = convertRequestToUrl(selectedGroups, variableGroups, overview);
	const { headers, verb, body } = overview;
	const firstLine = [
		`${verb.toUpperCase()} `,
		url.pathname,
	];

	if (overview.query && TypedObject.keys(overview.query).length > 0) {
		const builder = new URLSearchParams();

		for (const { name, value } of TypedObject.values(overview.query).filter(q => q.enabled))
			builder.append(name, parseValueParts(selectedGroups, variableGroups, value));

		firstLine.push(`?${builder.toString()}`);
	}

	if (url.hash)
		firstLine.push(url.hash);

	const out = [`${firstLine.join('')} HTTP/1.1`];

	if (!hasHeader('host', headers))
		out.push(`Host: ${url.hostname}${url.port ? `:${url.port}` : ''}`);

	if (!hasHeader('user-agent', headers))
		out.push(`User-Agent: Beak/${getGlobal('version') ?? ''} (${getGlobal('os')})`);

	if (headers) {
		out.push(...TypedObject.values(headers)
			.filter(h => h.enabled)
			.map(({ name, value }) => `${name}: ${parseValueParts(selectedGroups, variableGroups, value)}`),
		);
	}

	const bodyOut = createBodySection(verb, body);

	if (bodyOut !== null) {
		const hasContentTypeHeader = TypedObject.keys(headers)
			.map(h => h.toLocaleLowerCase())
			.find(h => h === 'content-type');

		if (!hasContentTypeHeader && body.type !== 'text') {
			const contentType = requestBodyContentType(body);

			out.push(`Content-Type: ${contentType}`);
		}

		// Padding between headers/body
		out.push('');

		if (body.type === 'json')
			out.push(JSON.stringify(convertToRealJson(selectedGroups, variableGroups, body.payload), null, '\t'));
		else if (body.type === 'text')
			out.push(body.payload);
		else if (body.type === 'url_encoded_form')
			out.push(convertKeyValueToString(selectedGroups, variableGroups, body.payload));
		else
			out.push('Unknow body type...');
	}

	return out.join('\n');
}

function hasHeader(header: string, headers: Record<string, ToggleKeyValue>) {
	return Boolean(TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === header.toLowerCase()));
}

export default RequestOutput;
