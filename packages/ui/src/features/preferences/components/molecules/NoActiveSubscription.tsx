import React from 'react';
import styled from 'styled-components';

const NoActiveSubscription: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Title>{'Please visit https://getbeak.app to purchase a subscription'}</Title>
);

const Title = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: var(--beak-colors-fg-muted);
`;

export default NoActiveSubscription;
