import React from 'react';
import styled from 'styled-components';

interface SidebarPaneProps {

}

const SidebarPane: React.FC<React.PropsWithChildren<SidebarPaneProps>> = ({ children }) => (
	<Container>
		{children}
	</Container>
);

const Container = styled.div`
	display: flex;
	flex-direction: column;

	height: 100%;
	overflow-y: hidden;
`;

export default SidebarPane;
