import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Flight } from '@beak/app/store/flight/types';
import { getStatusReasonPhrase } from '@beak/app/utils/http';
import { convertRequestToUrl } from '@beak/app/utils/uri';
import { statusToColor } from '@beak/design-system/helpers';
import styled from 'styled-components';

export interface HeaderProps {
	selectedFlight: Flight;
}

const Header: React.FunctionComponent<React.PropsWithChildren<HeaderProps>> = props => {
	const { variableGroups } = useSelector(s => s.global.variableGroups);
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const { error, request, response } = props.selectedFlight;
	const context = { selectedGroups, variableGroups };
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
				<Abbr title={url}>
					{/* The "&lrm;" char is a requirement of using RTL to trim the end vs start of the string */}
					{url}&lrm;
				</Abbr>
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

const Abbr = styled.abbr`
	text-decoration: none;
`;

const StatusSection = styled(Section)<{ $status: number }>`
	background-color: ${p => p.theme.ui.background};
	border-color: ${p => statusToColor(p.theme, p.$status)};
	color: ${p => statusToColor(p.theme, p.$status)};

	white-space: nowrap;
`;

export default Header;
