import React from 'react';
import styled from 'styled-components';

import Container from '../../../../components/atoms/Container';
import { SubTitle, Title } from '../../../../components/atoms/Typography';

const BeakOverview: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => (
	<Container>
		<Wrapper>
			<Title>{'Some cool product info'}</Title>
			<SubTitle>
				{'Not sure what to put here, but we\'re in beta so I\'m excusing my lazyness xo'}
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
