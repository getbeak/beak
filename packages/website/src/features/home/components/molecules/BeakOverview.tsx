import React from 'react';
import styled from 'styled-components';

import Container from '../../../../components/atoms/Container';
import { SubTitle, Title } from '../../../../components/atoms/Typography';

const BeakOverview: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Container>
		<Wrapper>
			<Title>{'What is Beak?'}</Title>
			<SubTitle>
				{'Beak is the one stop shop for testing, building, managing, and reverse engineering API\'s — '}
				<strong>{'quickly'}</strong>{' '}
				{'and '}
				<strong>{'easily'}</strong>{'.'}
			</SubTitle>

			<Image src={'/assets/overview.png'} />
		</Wrapper>
	</Container>
);

const Wrapper = styled.div`
	margin: 60px 0;
	text-align: center;
`;

const Image = styled.img`
	max-width: 100%;
	object-fit: contain;

	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;

export default BeakOverview;
