// eslint-disable-next-line simple-import-sort/sort
import { RequestBody, RequestNode, RequestOverview } from '@beak/common/types/beak-project';
import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import { TypedObject } from '@beak/common/helpers/typescript';
import { convertRequestToUrl } from '@beak/common/dist/helpers/uri';

const bodyFreeVerbs = ['get', 'head'];

export interface RequestOutputProps {
	selectedNode: RequestNode;
	editorHeight: string;
}

const RequestOutput: React.FunctionComponent<RequestOutputProps> = props => {
	const code = createBasicHttpOutput(props.selectedNode.info);

	return (
		<React.Fragment>
			<AceEditor
				mode={'text'}
				theme={'solarized_dark'}
				height={'100%'}
				width={'100%'}
				readOnly
				setOptions={{
					useWorker: false,
					fixedWidthGutter: true,
					fontFamily: 'monospace',
					fontSize: '13px',
				}}
				value={code}
				showPrintMargin={false}
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

export function createBasicHttpOutput(overview: RequestOverview) {
	const url = convertRequestToUrl(overview);
	const { headers, verb, body } = overview;
	const firstLine = [
		`${verb.toUpperCase()} `,
		url.pathname,
	];

	if (overview.uri.query) {
		const builder = new URLSearchParams();

		for (const { name, value } of TypedObject.values(overview.uri.query).filter(q => q.enabled))
			builder.append(name, value);

		firstLine.push(`?${builder.toString()}`);
	}

	if (url.hash)
		firstLine.push(url.hash);

	const out = [
		`${firstLine.join('')} HTTP/1.1`,
		`Host: ${url.hostname}`,
		'Connection: close',
		'User-Agent: Beak/0.0.1 (Macintosh; OS X/10.15.4)',
	];

	if (headers) {
		out.push(...TypedObject.values(headers)
			.filter(h => h.enabled)
			.map(({ name, value }) => `${name}: ${value}`),
		);
	}

	const bodyOut = createBodySection(verb, body);

	if (bodyOut !== null)
		out.push('', bodyOut);

	return out.join('\n');
}

export default RequestOutput;
