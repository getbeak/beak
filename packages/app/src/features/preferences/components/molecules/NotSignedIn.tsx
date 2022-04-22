import React from 'react';
import styled from 'styled-components';

const NotSignedIn: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => (
	<Title>
		{'Please sign into your account to view your subscription plan'}
	</Title>
);

const Title = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
`;

export default NotSignedIn;
