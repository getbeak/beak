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
import { createBasicHttpOutput } from '../../../request-pane/components/organisms/RequestOutput';

type Tab = 'raw';

export interface RequestPaneProps {
	flight: Flight;
}

const RequestPane: React.FunctionComponent<RequestPaneProps> = props => {
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
							value={createBasicHttpOutput(flight.request)}
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

export default RequestPane;
