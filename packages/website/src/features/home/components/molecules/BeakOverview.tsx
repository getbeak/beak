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

			<Picture>
				<source srcSet={'/assets/overview.webp'} type={'image/webp'} />
				<source srcSet={'/assets/overview.png'} type={'image/png'} />
				<Image loading={'lazy'} src={'/assets/overview.png'} alt={'Beak\'s interface, showing the project explorer and request view.'} />
			</Picture>
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

const Picture = styled(Image).attrs({ as: 'picture' })``;

export default BeakOverview;
