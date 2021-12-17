import binaryStore from '@beak/app/lib/binary-store';
import { Flight } from '@beak/app/store/flight/types';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { TypedObject } from '@beak/common/helpers/typescript';
import Editor from '@monaco-editor/react';
import mime from 'mime-types';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import EnrichedTab from './EnrichedTab';
import ErrorView from './ErrorView';

type Tab = 'raw' | 'enriched';

export interface ResponseTabProps {
	flight: Flight;
}

const ResponseTab: React.FunctionComponent<ResponseTabProps> = props => {
	const { flight } = props;
	const { error, response } = flight;
	const hasErrored = Boolean(error);
	const enrichable = canEnrich(flight);
	const [tab, setTab] = useState<Tab>(enrichable ? 'enriched' : 'raw');

	useEffect(() => {
		if (tab === 'enriched' && !enrichable)
			setTab('raw');
	}, [tab, enrichable]);

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'raw'}
					size={'sm'}
					onClick={() => setTab('raw')}
				>
					{hasErrored ? 'Error' : 'Raw'}
				</TabItem>
				{enrichable && (
					<TabItem
						active={tab === 'enriched'}
						size={'sm'}
						onClick={() => setTab('enriched')}
					>
						{'Enriched'}
					</TabItem>
				)}
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'raw' && (
					<React.Fragment>
						{response && (
							<Editor
								height={'100%'}
								width={'100%'}
								language={'javascript'}
								theme={'vs-dark'}
								value={createHttpResponseMessage(flight)}
								options={{
									...createDefaultOptions(),
									readOnly: true,
								}}
							/>
						)}
						{error && (
							<ErrorView error={error} />
						)}
					</React.Fragment>
				)}
				{enrichable && tab === 'enriched' && (
					<EnrichedTab flight={flight} />
				)}
			</TabBody>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 100%;
`;

const TabBody = styled.div`
	flex-grow: 2;

	overflow-y: hidden;
	height: 100%;
`;

function createHttpResponseMessage(flight: Flight) {
	const { binaryStoreKey, response } = flight;
	const lines = [
		`${response!.status} HTTP/1.1`,
		...TypedObject.keys(response!.headers).map(k => `${k}: ${response!.headers[k]}`),
	];

	if (response!.hasBody) {
		const store = binaryStore.get(binaryStoreKey);

		// TODO(afr): Read encoding from content headers
		// TODO(afr): Truncate bodies longer than 1MB?
		const decoder = new TextDecoder('utf-8');
		const string = decoder.decode(store);

		if (string.startsWith('\n'))
			lines.push(string);
		else
			lines.push('', string);
	}

	return lines.join('\n');
}

function canEnrich(flight: Flight) {
	if (!flight.response?.hasBody)
		return false;

	const contentType = flight.response!.headers['content-type'];
	const extension = mime.extension(contentType);

	return extension === 'json';
}

export default ResponseTab;
