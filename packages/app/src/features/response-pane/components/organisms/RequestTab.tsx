import { Flight } from '@beak/app/store/flight/types';
import React, { useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import { createBasicHttpOutput } from '../../../request-pane/components/molecules/RequestOutput';

type Tab = 'raw';

export interface RequestTabProps {
	flight: Flight;
}

const RequestTab: React.FunctionComponent<RequestTabProps> = props => {
	const { flight } = props;
	const [tab, setTab] = useState<Tab>('raw');
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);

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
						<MonacoEditor
							height={'100%'}
							width={'100%'}
							language={'javascript'}
							theme={'vs-dark'}
							value={createBasicHttpOutput(flight.request, selectedGroups, variableGroups!)}
							options={{
								automaticLayout: true,
								readOnly: true,
								minimap: { enabled: false },
								fontFamily: "'Fira Code', Source Code Pro, Menlo, Monaco, 'Courier New', monospace",
								fontSize: 13,
							}}
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

export default RequestTab;
