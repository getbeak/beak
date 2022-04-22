import React from 'react';
import styled from 'styled-components';

interface PaneProps {
	title: string;
}

const Pane: React.FunctionComponent<React.PropsWithChildren<PaneProps>> = ({ title, children }) => (
	<Wrapper>
		<Title>{title}</Title>
		<Container>
			{children}
		</Container>
	</Wrapper>
);

const Wrapper = styled.div`
	padding: 50px 40px;
	padding-bottom: 0;
	height: calc(100% - 50px);
	-webkit-app-region: drag;
`;

const Title = styled.div`
	font-size: 25px;
	font-weight: 500;
`;

const Container = styled.div`
	background: transparent;
	-webkit-app-region: no-drag;
	margin-top: 20px;
`;

export default Pane;
