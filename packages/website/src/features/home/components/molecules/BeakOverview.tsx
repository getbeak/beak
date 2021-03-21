import React from 'react';
import styled from 'styled-components';

import Container from '../../../../components/atoms/Container';
import { SubTitle, Title } from '../../../../components/atoms/Typography';

const BeakOverview: React.FunctionComponent = () => (
	<Container>
		<Wrapper>
			<Title>{'Some product info'}</Title>
			<SubTitle>
				{'Some more detailed product information, maybe in a smaller font with a '}
				{'slightly faded colour...'}
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
`;

export default BeakOverview;
