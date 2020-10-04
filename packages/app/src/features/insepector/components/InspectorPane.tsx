import { statusToColour } from '@beak/app/src/design-system/helpers';
import { RequestNode } from '@beak/common/src/beak-project/types';
import { constructUri } from '@beak/common/src/beak-project/url';
import { getReasonPhrase } from 'http-status-codes';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import InspectorTabs from './organisms/InspectorTabs';

const InspectorPane: React.FunctionComponent = () => {
	const flight = useSelector(s => s.global.flight);
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedRequest)
		return <Container />;

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

	const typedSelectedNode = selectedNode as RequestNode;
	const flightHistory = flight.flightHistory[typedSelectedNode.id]?.[0];

	// TODO(afr): Maybe some sort of purgatory state here
	if (!flightHistory)
		return <Container />;

	const response = flightHistory.response;

	return (
		<Container>
			<UrlHeaderWrapper>
				<Section>
					<strong>{flightHistory.request.uri.verb.toUpperCase()}</strong>
				</Section>
				<UrlSection>
					{constructUri(flightHistory.request)}
				</UrlSection>
				<StatusSection $status={response.status}>
					<strong>{response.status}</strong>
					{' '}
					{safeGetReasonPhrase(response.status)}
				</StatusSection>
			</UrlHeaderWrapper>
			<InspectorTabs flight={flightHistory!} />
		</Container>
	);
};

function safeGetReasonPhrase(status: number) {
	try {
		return getReasonPhrase(status);
	} catch {
		return '';
	}
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: 100%;
	width: 100%;
`;

const UrlHeaderWrapper = styled.div`
	display: flex;
	margin: 25px auto;

	font-size: 15px;
`;

const Section = styled.div`
	background-color: ${p => p.theme.ui.background};

	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-radius: 4px;

	padding: 5px 9px;
	margin: 0 5px;
`;

const UrlSection = styled(Section)`
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const StatusSection = styled(Section)<{ $status: number }>`
	background-color: ${p => p.theme.ui.background};
	border-color: ${p => statusToColour(p.$status)};
	color: ${p => statusToColour(p.$status)};

	white-space: nowrap;
`;

export default InspectorPane;
