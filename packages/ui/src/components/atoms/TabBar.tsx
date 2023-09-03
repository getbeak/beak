import styled from 'styled-components';

export interface TabBarProps {
	centered?: boolean;
}

const TabBar = styled.div<TabBarProps>`
	display: flex;
	flex-direction: row;
	align-items: flex-end;

	justify-content: ${props => props.centered ? 'center' : 'initial'};
	overflow-x: overlay;

	min-width: 100%;

	&::-webkit-scrollbar {
		height: 0;

		transition: height .1s ease;
	}

	&:hover {
		&::-webkit-scrollbar {
			height: 3px;
		}
	}
`;

export default TabBar;
