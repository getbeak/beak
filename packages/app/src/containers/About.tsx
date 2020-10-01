import React from 'react';
import styled from 'styled-components';

import DraggableContainer from '../components/atoms/DraggableContainer';

const About: React.FunctionComponent = () => (
	<React.Fragment>
		<DraggableContainer>
			<Title>{'About Beak'}</Title>
		</DraggableContainer>

		<Container>
			<Blob
				style={{
					height: '500px',
					width: '500px',
					bottom: '-200px',
					right: '-200px',
				}}
			/>
			<Blob
				style={{
					height: '300px',
					width: '300px',
					bottom: '-100px',
					left: '-50px',
				}}
			/>

			<TextCenter>
				<h1>{'🇬🇧🌶🍷'}</h1>

				<p>
					{'Designed (poorly) and built in the United Kingdom. Fueled by '}
					{'endless Picante\'s and Lady A'}
				</p>

				<SmolPara>
					{'Made in loving memory of Pierre 💔'}
				</SmolPara>
			</TextCenter>
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

const Blob = styled.div`
	position: absolute;
	border-radius: 100%;
	background-color: ${props => props.theme.ui.primaryFill};
`;

const TextCenter = styled.div`
	text-align: center;
`;

const SmolPara = styled.p`
	text-size: 13px;
`;

export default About;
