import { Flight } from '@beak/app/store/flight/types';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import React, { useEffect, useState } from 'react';
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
	const [output, setOutput] = useState('');
	const [tab, setTab] = useState<Tab>('raw');
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);

	useEffect(() => {
		createBasicHttpOutput(flight.request, selectedGroups, variableGroups!).then(setOutput);
	}, [flight.request, selectedGroups, variableGroups]);

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
							value={output}
							options={{
								...createDefaultOptions(),
								readOnly: true,
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

	overflow-y: hidden;
	height: 100%;
`;

export default RequestTab;
