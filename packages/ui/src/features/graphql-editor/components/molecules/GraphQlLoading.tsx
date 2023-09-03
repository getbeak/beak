import React from 'react';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const GraphQlLoading: React.FC = () => (
	<Wrapper>
		<FontAwesomeIcon
			icon={faSpinner}
			opacity={0.4}
			spin
			speed={10}
			size={'4x'}
		/>
		<Title>{'Fetching GraphQL schema'}</Title>
	</Wrapper>
);

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	text-align: center;
	padding: 60px 40px;
	height: calc(100% - 120px);
	max-width: 600px;
	margin: 0 auto;

	align-items: center;

	svg > path {
		fill: ${p => p.theme.ui.textMinor};
	}
`;

const Title = styled.div`
	font-size: 18px;
	margin: 10px 0;
	font-weight: 300;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export default GraphQlLoading;
