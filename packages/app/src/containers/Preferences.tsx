import React from 'react';
import styled from 'styled-components';

import DraggableContainer from '../components/atoms/DraggableContainer';

const About: React.FunctionComponent = () => (
	<React.Fragment>
		<DraggableContainer>
			{/* <Title>{'Beak prefer'}</Title> */}
		</DraggableContainer>

		<Container>
			
		</Container>
	</React.Fragment>
);

const Title = styled.h1`
	margin: 30px 30px;
	font-weight: 300;
`;

const Container = styled.div`
	margin: 0 30px;
`;

export default About;
