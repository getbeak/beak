import { statusToColour } from '@beak/app/src/design-system/helpers';
import { Flight } from '@beak/app/src/store/flight/types';
import { constructUri } from '@beak/common/src/beak-project/url';
import { getReasonPhrase } from 'http-status-codes';
import React from 'react';
import styled from 'styled-components';

export interface HeaderProps {
	flightHistory: Flight[];
	selectedFlightIndex: number;
}

const Header: React.FunctionComponent<HeaderProps> = props => {
	const { flightHistory, selectedFlightIndex } = props;
	const selectedFlight = flightHistory[selectedFlightIndex];
	const { request, response } = selectedFlight;

	return (
		<UrlHeaderWrapper>
			<Section>
				<strong>{request.uri.verb.toUpperCase()}</strong>
			</Section>
			<UrlSection>
				{constructUri(request)}
			</UrlSection>
			<StatusSection $status={response.status}>
				<strong>{response.status}</strong>
				{' '}
				{safeGetReasonPhrase(response.status)}
			</StatusSection>
		</UrlHeaderWrapper>
	);
};

function safeGetReasonPhrase(status: number) {
	try {
		return getReasonPhrase(status);
	} catch {
		return '';
	}
}

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

export default Header;
