import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import EditorView from '@beak/app/components/atoms/EditorView';
import BasicTableEditor from '@beak/app/features/basic-table-editor/components/BasicTableEditor';
import binaryStore from '@beak/app/lib/binary-store';
import { requestPreferenceSetResSubTab } from '@beak/app/store/preferences/actions';
import { useAppSelector } from '@beak/app/store/redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@cuvva/ksuid';
import type { Flight } from '@getbeak/types/flight';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import ErrorView from '../molecules/ErrorView';
import PrettyViewer from './PrettyViewer';

type Tab = typeof tabs[number];
const tabs = ['headers', 'pretty', 'raw'] as const;

export interface ResponseTabProps {
	flight: Flight;
}

const ResponseTab: React.FC<React.PropsWithChildren<ResponseTabProps>> = props => {
	const { flight } = props;
	const dispatch = useDispatch();
	const { error, response, requestId } = flight;
	const hasErrored = Boolean(error);
	const tab = useAppSelector(s =>
		s.global.preferences.requests[requestId]?.response.subTab.response,
	) as Tab | undefined;

	function convertHeaderFormat() {
		return Object.keys(flight.response!.headers)
			.reduce((acc, val) => ({
				...acc,
				[ksuid.generate('header').toString()]: {
					name: val,
					value: [flight.response!.headers[val]],
					enabled: true,
				},
			}), {});
	}

	// Ensure we have a valid tab
	useEffect(() => {
		if (hasErrored) {
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: 'raw' }));

			return;
		}

		if (!tab || !tabs.includes(tab))
			dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: 'pretty' }));
	}, [tab, flight.flightId]);

	function setTab(tab: Tab) {
		dispatch(requestPreferenceSetResSubTab({ id: requestId, tab: 'response', subTab: tab }));
	}

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				{!hasErrored && (
					<React.Fragment>
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
					</React.Fragment>
				)}
				<TabItem
					active={tab === 'raw'}
					size={'sm'}
					onClick={() => setTab('raw')}
				>
					{hasErrored ? 'Error' : 'Raw'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'headers' && (
					<BasicTableEditor
						items={convertHeaderFormat()}
						readOnly
					/>
				)}
				{tab === 'pretty' && (
					<PrettyViewer flight={flight} mode={'response'} />
				)}
				{tab === 'raw' && (
					<React.Fragment>
						{response && (
							<EditorView
								language={'http'}
								value={createHttpResponseMessage(flight)}
								options={{ readOnly: true }}
							/>
						)}
						{error && <ErrorView error={error} />}
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

export default ResponseTab;
