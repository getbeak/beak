import React from 'react';
import binaryStore from '@beak/app/lib/binary-store';
import { Flight } from '@beak/app/store/flight/types';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor from '@monaco-editor/react';
import mime from 'mime-types';

export interface EnrichedTabProps {
	flight: Flight;
}

const EnrichedTab: React.FunctionComponent<EnrichedTabProps> = props => {
	const { flight } = props;
	const enriched = enrich(flight);

	if (enriched === null)
		return null;

	return (
		<Editor
			height={'100%'}
			width={'100%'}
			language={enriched.extension}
			theme={'vs-dark'}
			value={enriched.body}
			options={{
				...createDefaultOptions(),
				readOnly: true,
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
