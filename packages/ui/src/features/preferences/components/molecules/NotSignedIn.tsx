import React from 'react';
import styled from 'styled-components';

const NotSignedIn: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Title>{'Please sign into your account to view your subscription plan'}</Title>
);

const Title = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: var(--beak-colors-fg-muted);
`;

export default NotSignedIn;
