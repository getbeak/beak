import { TypedObject } from '@beak/common/helpers/typescript';
import EditorView from '@beak/ui/components/atoms/EditorView';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import binaryStore from '@beak/ui/lib/binary-store';
import { requestPreferenceSetResSubTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { Flight } from '@getbeak/types/flight';
import { Box, Flex } from '@chakra-ui/react';
import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import ErrorView from '../molecules/ErrorView';
import PrettyViewer from './PrettyViewer';
import SseTab from './SseTab';

type Tab = (typeof tabs)[number];
const tabs = ['headers', 'pretty', 'raw', 'events'] as const;

export interface ResponseTabProps {
	flight: Flight;
}

const ResponseTab: React.FC<React.PropsWithChildren<ResponseTabProps>> = props => {
	const { flight } = props;
	const dispatch = useDispatch();
	const { error, response, requestId } = flight;
	const hasErrored = Boolean(error);
	const tab = useAppSelector(s => s.global.preferences.requests[requestId]?.response.subTab.response) as Tab | undefined;

	// Show the Events tab whenever the flight is (or was) an SSE stream — we
	// check live state for in-progress flights and the persisted streamKind on
	// completed history entries so the tab persists post-completion.
	const showSseTab = useAppSelector(s => {
		const live = s.global.flight.activeFlights[flight.flightId]?.head?.streamKind;
		if (live) return live === 'sse';
		const historic = s.global.flight.flightHistories[requestId]?.history[flight.flightId]?.streamKind;
		return historic === 'sse';
	});

	const headerItems = useMemo(() => {
		if (!flight.response) return {};
		const headers = flight.response.headers;
		return Object.keys(headers).reduce(
			(acc, name, idx) => ({
				...acc,
				[`header-${idx}-${name.toLowerCase()}`]: {
					name,
					value: [headers[name]],
					enabled: true,
				},
			}),
			{},
		);
	}, [flight.response]);

	// Ensure we have a valid tab
	useEffect(() => {
		if (hasErrored) {
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: 'raw' }));

			return;
		}

		if (!tab || !tabs.includes(tab)) {
			// SSE responses default to the events tab — that's the meaningful view.
			const initial: Tab = showSseTab ? 'events' : 'pretty';
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: initial }));
		} else if (tab === 'events' && !showSseTab) {
			// Tab was remembered from a prior SSE flight but this one is standard.
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: 'pretty' }));
		}
	}, [tab, flight.flightId, hasErrored, requestId, dispatch, showSseTab]);

	function setTab(tab: Tab) {
		dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: tab }));
	}

	return (
		<Flex direction='column' overflow='hidden' h='100%'>
			<TabBar $centered>
				<TabSpacer />
				{!hasErrored && (
					<React.Fragment>
						<TabItem active={tab === 'headers'} size={'sm'} onClick={() => setTab('headers')}>
							{'Headers'}
						</TabItem>
						{showSseTab && (
							<TabItem active={tab === 'events'} size={'sm'} onClick={() => setTab('events')}>
								{'Events'}
							</TabItem>
						)}
						<TabItem active={tab === 'pretty'} size={'sm'} onClick={() => setTab('pretty')}>
							{'Pretty'}
						</TabItem>
					</React.Fragment>
				)}
				<TabItem active={tab === 'raw'} size={'sm'} onClick={() => setTab('raw')}>
					{hasErrored ? 'Error' : 'Raw'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<Box flexGrow={2} overflowY='hidden' h='100%'>
				{tab === 'headers' && <BasicTableEditor items={headerItems} readOnly />}
				{tab === 'events' && showSseTab && <SseTab flight={flight} />}
				{tab === 'pretty' && <PrettyViewer flight={flight} mode={'response'} />}
				{tab === 'raw' && (
					<React.Fragment>
						{response && (
							<EditorView language={'http'} value={createHttpResponseMessage(flight)} options={{ readOnly: true }} />
						)}
						{error && <ErrorView error={error} />}
					</React.Fragment>
				)}
			</Box>
		</Flex>
	);
};

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

		if (string.startsWith('\n')) lines.push(string);
		else lines.push('', string);
	}

	return lines.join('\n');
}

export default ResponseTab;
