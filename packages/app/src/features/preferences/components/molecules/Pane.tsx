import React from 'react';
import styled from 'styled-components';

interface PaneProps {
	title: string;
}

const Pane: React.FunctionComponent<PaneProps> = ({ title, children }) => (
	<Wrapper>
		<Title>{title}</Title>
		<Container>
			{children}
		</Container>
	</Wrapper>
);

const Wrapper = styled.div`
	padding: 50px 40px;
	height: calc(100% - 100px);
	-webkit-app-region: drag;
`;

const Title = styled.div`
	font-size: 25px;
	font-weight: 500;
`;

const Container = styled.div`
	-webkit-app-region: no-drag;
	margin-top: 20px;
`;

export default Pane;
