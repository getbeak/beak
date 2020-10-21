// eslint-disable-next-line simple-import-sort/sort
import React, { useState } from 'react';
import AceEditor from 'react-ace';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import { Flight } from '@beak/app/src/store/flight/types';
import { ResponseOverview } from '@beak/common/src/beak-project/types';
import { TypedObject } from '@beak/common/src/helpers/typescript';
import binaryStore from '@beak/app/src/lib/binary-store';

type Tab = 'raw';

export interface ResponsePaneProps {
	flight: Flight;
}

const ResponsePane: React.FunctionComponent<ResponsePaneProps> = props => {
	const { flight } = props;
	const [tab, setTab] = useState<Tab>('raw');

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'raw'}
					size={'sm'}
					onClick={() => setTab('raw')}
				>
					{'Raw'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'raw' && (
					<React.Fragment>
						<AceEditor
							mode={'text'}
							theme={'solarized_dark'}
							height={'100%'}
							width={'100%'}
							readOnly
							setOptions={{
								useWorker: false,
								fontFamily: 'monospace',
								fontSize: '12px',
							}}
							value={createHttpResponseMessage(flight)}
							showPrintMargin={false}
						/>
					</React.Fragment>
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

	overflow-y: auto;
	height: 100%;
`;

function createHttpResponseMessage(flight: Flight) {
	const { binaryStoreKey, response } = flight;
	const lines = [
		`${response.status} HTTP/1.1`,
		...TypedObject.keys(response.headers).map(k => `${k}: ${response.headers[k]}`),
	];

	if (response.hasBody) {
		const store = binaryStore.get(binaryStoreKey);

		// TODO(afr): Read encoding from content headers
		// TODO(afr): Concatinate bodies longer than 1MB?
		const decoder = new TextDecoder('utf-8');
		const string = decoder.decode(store);

		lines.push('\n', string);
	}

	return lines.join('\n');
}

export default ResponsePane;
