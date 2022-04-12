import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import BasicTableEditor from '@beak/app/features/basic-table-editor/components/BasicTableEditor';
import { Flight } from '@beak/app/store/flight/types';
import { requestPreferenceSetResSubTab } from '@beak/app/store/preferences/actions';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor from '@monaco-editor/react';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import { createBasicHttpOutput } from '../../../request-pane/components/molecules/RequestOutput';

type Tab = typeof tabs[number];
const tabs = ['headers', 'raw'] as const;

export interface RequestTabProps {
	flight: Flight;
}

const RequestTab: React.FunctionComponent<RequestTabProps> = props => {
	const { flight } = props;
	const dispatch = useDispatch();
	const requestId = flight.requestId;
	const [output, setOutput] = useState('');
	const tab = useSelector(s => s.global.preferences.requests[requestId].response.subTab.request) as Tab | undefined;
	const { variableGroups } = useSelector(s => s.global.variableGroups);
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const windowSession = useContext(WindowSessionContext);
	const context = { selectedGroups, variableGroups };

	// Ensure we have a valid tab
	useEffect(() => {
		if (!tab || !tabs.includes(tab))
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: 'raw' }));
	}, [tab]);

	function setTab(tab: Tab) {
		dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: tab }));
	}

	useEffect(() => {
		createBasicHttpOutput(flight.request, context, windowSession).then(setOutput);
	}, [flight.request, selectedGroups, variableGroups]);

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'headers'}
					size={'sm'}
					onClick={() => setTab('headers')}
				>
					{'Headers'}
				</TabItem>
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
				{tab === 'headers' && (
					<BasicTableEditor
						items={flight.request.headers}
						readOnly
					/>
				)}
				{tab === 'raw' && (
					<React.Fragment>
						<Editor
							height={'100%'}
							width={'100%'}
							language={'http'}
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
