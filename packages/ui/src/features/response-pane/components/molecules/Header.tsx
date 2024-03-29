import React, { useEffect, useState } from 'react';
import { statusToColor } from '@beak/design-system/helpers';
import useRealtimeValueContext from '@beak/ui/features/realtime-values/hooks/use-realtime-value-context';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { Flight } from '@getbeak/types/flight';
import styled from 'styled-components';

export interface HeaderProps {
	selectedFlight: Flight;
}

const Header: React.FC<React.PropsWithChildren<HeaderProps>> = props => {
	const { error, request, response } = props.selectedFlight;
	const context = useRealtimeValueContext(props.selectedFlight.requestId);
	const [url, setUrl] = useState('');

	useEffect(() => {
		convertRequestToUrl(context, request).then(s => setUrl(s.toString()));
	}, [context, request]);

	return (
		<UrlHeaderWrapper>
			<Section>
				<strong>{request.verb.toUpperCase()}</strong>
			</Section>
			<UrlSection>
				<div
					data-tooltip-id={'tt-response-header-url-bar'}
					data-tooltip-content={url}
				>
					{/* The "&lrm;" char is a requirement of using RTL to trim the end vs start of the string */}
					{url}&lrm;
				</div>
			</UrlSection>
			{response && (
				<StatusSection $status={response.status}>
					<strong>{response.status}</strong>
					{' '}
					{getStatusReasonPhrase(response.status)}
				</StatusSection>
			)}
			{error && (
				<StatusSection $status={500}>
					<strong>{'Error'}</strong>
				</StatusSection>
			)}
		</UrlHeaderWrapper>
	);
};

const UrlHeaderWrapper = styled.div`
	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;

	margin: 25px auto;
	margin-bottom: 26.5px;
	padding: 0 10px;
	font-size: 13px;
	max-width: calc(100% - 20px);
`;

const Section = styled.div`
	flex: 0 0 auto;
	background-color: ${p => p.theme.ui.background};

	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-radius: 4px;

	padding: 5px 8px;
	margin: 0 5px;
`;

const UrlSection = styled(Section)`
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	direction: rtl;
`;

const StatusSection = styled(Section)<{ $status: number }>`
	background-color: ${p => p.theme.ui.background};
	border-color: ${p => statusToColor(p.theme, p.$status)};
	color: ${p => statusToColor(p.theme, p.$status)};

	white-space: nowrap;
`;

export default Header;
