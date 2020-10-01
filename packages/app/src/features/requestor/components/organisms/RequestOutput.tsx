// eslint-disable-next-line simple-import-sort/sort
import { RequestNode } from '@beak/common/src/beak-project/types';
import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-terminal';
import { TypedObject } from '@beak/common/src/helpers/typescript';

export interface RequestOutputProps {
	selectedNode: RequestNode;
	editorHeight: string;
}

const RequestOutput: React.FunctionComponent<RequestOutputProps> = props => {
	const code = createBasicHttpOutput(props.selectedNode);

	return (
		<React.Fragment>
			<AceEditor
				mode={'html'}
				theme={'terminal'}
				height={'100%'}
				width={'100%'}
				readOnly
				setOptions={{
					useWorker: false,
					fontFamily: 'monospace',
					fontSize: '14px',
				}}
				value={code}
				showPrintMargin={false}
			/>
		</React.Fragment>
	);
};

function createBasicHttpOutput(node: RequestNode) {
	const { info } = node;
	const { headers, uri } = info;
	const firstLine = [
		`${uri.verb.toUpperCase()} `,
		uri.path,
	];

	if (uri.query) {
		const builder = new URLSearchParams();

		for (const { name, value } of TypedObject.values(uri.query).filter(q => q.enabled))
			builder.append(name, value);

		firstLine.push(`?${builder.toString()}`);
	}

	if (uri.fragment)
		firstLine.push(`#${uri.fragment}`);

	const out = [
		`${firstLine.join('')} HTTP/1.1`,
		`Host: ${uri.hostname}`,
		'Connection: close',
		'User-Agent: Beak/0.0.1 (Macintosh; OS X/10.15.4)',
	];

	if (headers) {
		out.push(...TypedObject.values(headers)
			.filter(h => h.enabled)
			.map(({ name, value }) => `${name}: ${value}`),
		);
	}

	out.push('');

	return out.join('\n');
}

export default RequestOutput;
