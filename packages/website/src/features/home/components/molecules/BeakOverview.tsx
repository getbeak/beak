import React from 'react';
import styled from 'styled-components';

const BeakOverview: React.FunctionComponent = () => (
	<Wrapper>
		<Title>{'Some product info'}</Title>
		<SubTitle>
			{'Some more detailed product information, maybe in a smaller font with a '}
			{'slightly faded colour...'}
		</SubTitle>

		<Image src={'/assets/overview.png'} />
	</Wrapper>
);

const Wrapper = styled.div`
	margin: 60px 0;
`;

const Title = styled.div`
	text-align: center;
	font-size: 40px;
	font-weight: 700;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const SubTitle = styled.div`
	text-align: center;
	font-size: 16px;
	margin-top: 10px;
	color: ${p => p.theme.ui.textMinor};
`;

const Image = styled.img`
	max-width: 100%;
	object-fit: contain;
`;

export default BeakOverview;
