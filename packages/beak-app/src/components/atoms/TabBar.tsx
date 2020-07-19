import styled from 'styled-components';

export interface TabBarProps {
	centered?: boolean;
}

const TabBar = styled.div<TabBarProps>`
	display: flex;
	flex-direction: row;
	align-items: center;

	justify-content: ${props => props.centered ? 'center' : 'initial'};

	width: 100%;
`;

export default TabBar;
