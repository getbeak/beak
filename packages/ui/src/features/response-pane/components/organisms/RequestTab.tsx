import { Box, Flex } from '@chakra-ui/react';
import EditorView from '@beak/ui/components/atoms/EditorView';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { requestPreferenceSetResSubTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { Flight } from '@getbeak/types/flight';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import { createBasicHttpOutput } from '../../../request-pane/components/molecules/RequestOutput';
import PrettyViewer from './PrettyViewer';

type Tab = (typeof tabs)[number];
const tabs = ['headers', 'pretty', 'raw'] as const;

export interface RequestTabProps {
	flight: Flight;
}

const RequestTab: React.FC<RequestTabProps> = ({ flight }) => {
	const requestId = flight.requestId;
	const dispatch = useDispatch();
	const [output, setOutput] = useState('');
	const { variableSets } = useAppSelector(s => s.global.variableSets);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const tab = useAppSelector(
		s => s.global.preferences.requests[requestId].response.subTab.request,
	) as Tab | undefined;

	const windowSession = useContext(WindowSessionContext);
	const context = useVariableContext(requestId);

	useEffect(() => {
		if (!tab || !tabs.includes(tab)) {
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: 'raw' }));
		}
	}, [tab, flight.flightId]);

	function setTab(tab: Tab) {
		dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'request', subTab: tab }));
	}

	useEffect(() => {
		let cancelled = false;
		createBasicHttpOutput(flight.request, context, windowSession).then(value => {
			if (!cancelled) setOutput(value);
		});
		return () => {
			cancelled = true;
		};
	}, [flight.request, selectedSets, variableSets]);

	return (
		<Flex direction='column' overflow='hidden' h='100%'>
			<TabBar $centered>
				<TabSpacer />
				<TabItem active={tab === 'headers'} size='sm' onClick={() => setTab('headers')}>{'Headers'}</TabItem>
				<TabItem active={tab === 'pretty'} size='sm' onClick={() => setTab('pretty')}>{'Pretty'}</TabItem>
				<TabItem active={tab === 'raw'} size='sm' onClick={() => setTab('raw')}>{'Raw'}</TabItem>
				<TabSpacer />
			</TabBar>

			<Box flexGrow={2} overflowY='hidden' h='100%'>
				{tab === 'headers' && <BasicTableEditor items={flight.request.headers} readOnly />}
				{tab === 'pretty' && <PrettyViewer flight={flight} mode='request' />}
				{tab === 'raw' && <EditorView language='http' value={output} options={{ readOnly: true }} />}
			</Box>
		</Flex>
	);
};

export default RequestTab;
