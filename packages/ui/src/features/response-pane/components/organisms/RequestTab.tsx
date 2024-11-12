import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import EditorView from '@beak/ui/components/atoms/EditorView';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import useRealtimeValueContext from '@beak/ui/features/realtime-values/hooks/use-realtime-value-context';
import { requestPreferenceSetResSubTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { Flight } from '@getbeak/types/flight';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import { createBasicHttpOutput } from '../../../request-pane/components/molecules/RequestOutput';
import PrettyViewer from './PrettyViewer';

type Tab = typeof tabs[number];
const tabs = ['headers', 'pretty', 'raw'] as const;

export interface RequestTabProps {
	flight: Flight;
}

const RequestTab: React.FC<React.PropsWithChildren<RequestTabProps>> = props => {
	const { flight } = props;
	const requestId = flight.requestId;
	const dispatch = useDispatch();
	const [output, setOutput] = useState('');
	const { variableGroups } = useAppSelector(s => s.global.variableGroups);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const tab = useAppSelector(
		s => s.global.preferences.requests[requestId].response.subTab.request,
	) as Tab | undefined;

	const windowSession = useContext(WindowSessionContext);
	const context = useRealtimeValueContext(requestId);

	// Ensure we have a valid tab
	useEffect(() => {
		if (!tab || !tabs.includes(tab))
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: 'raw' }));
	}, [tab, flight.flightId]);

	function setTab(tab: Tab) {
		dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: tab }));
	}

	useEffect(() => {
		createBasicHttpOutput(flight.request, context, windowSession).then(setOutput);
	}, [flight.request, selectedGroups, variableGroups]);

	return (
		<Container>
			<TabBar $centered>
				<TabSpacer />
				<TabItem
					active={tab === 'headers'}
					size={'sm'}
					onClick={() => setTab('headers')}
				>
					{'Headers'}
				</TabItem>
				<TabItem
					active={tab === 'pretty'}
					size={'sm'}
					onClick={() => setTab('pretty')}
				>
					{'Pretty'}
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
					<BasicTableEditor items={flight.request.headers} readOnly />
				)}
				{tab === 'pretty' && (
					<PrettyViewer flight={flight} mode={'request'} />
				)}
				{tab === 'raw' && (
					<React.Fragment>
						<EditorView
							language={'http'}
							value={output}
							options={{ readOnly: true }}
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
