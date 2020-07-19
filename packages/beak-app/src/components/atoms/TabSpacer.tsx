import styled from 'styled-components';

const TabSpacer = styled.div`
	flex-grow: 2;
	height: calc(100% - 1px); /* lol 🤷‍♂️ */
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
`;

export default TabSpacer;
