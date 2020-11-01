// eslint-disable-next-line simple-import-sort/sort
import React, { useState } from 'react';
import AceEditor from 'react-ace';
import styled from 'styled-components';
import mime from 'mime-types';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import { Flight } from '@beak/app/store/flight/types';
import { TypedObject } from '@beak/common/helpers/typescript';
import binaryStore from '@beak/app/lib/binary-store';

export interface EnrichedTabProps {
	flight: Flight;
}

const EnrichedTab: React.FunctionComponent<EnrichedTabProps> = props => {
	const { flight } = props;
	const enriched = enrich(flight);

	if (enriched === null)
		return null;

	return (
		<AceEditor
			mode={enriched.extension}
			theme={'solarized_dark'}
			height={'100%'}
			width={'100%'}
			readOnly
			setOptions={{
				useWorker: false,
				fontFamily: 'monospace',
				fontSize: '13px',
			}}
			value={enriched.body}
			showPrintMargin={false}
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
