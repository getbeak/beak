import binaryStore from '@beak/app/lib/binary-store';
import { Flight } from '@beak/app/store/flight/types';
import mime from 'mime-types';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

export interface EnrichedTabProps {
	flight: Flight;
}

const EnrichedTab: React.FunctionComponent<EnrichedTabProps> = props => {
	const { flight } = props;
	const enriched = enrich(flight);

	if (enriched === null)
		return null;

	return (
		<MonacoEditor
			height={'100%'}
			width={'100%'}
			language={enriched.extension}
			theme={'vs-dark'}
			value={enriched.body}
			options={{
				automaticLayout: true,
				readOnly: true,
				minimap: { enabled: false },
				fontFamily: "'Fira Code', Source Code Pro, Menlo, Monaco, 'Courier New', monospace",
				fontSize: 13,
			}}
		/>
	);
};

function enrich(flight: Flight) {
	if (!flight.response!.hasBody)
		return null;

	const contentType = flight.response!.headers['content-type'];
	const extension = mime.extension(contentType);

	if (extension !== 'json')
		return null;

	const key = flight.binaryStoreKey;
	const store = binaryStore.get(key);
	const decoder = new TextDecoder('utf-8');
	const string = decoder.decode(store);

	let body = string;

	try {
		body = JSON.stringify(JSON.parse(string), null, '\t');
	} catch { /* */ }

	return { extension, body };
}

export default EnrichedTab;
