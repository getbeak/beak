import styled from 'styled-components';

export const Row = styled.div`
	display: grid;
	grid-template-columns: minmax(0, .6fr) 35px minmax(0, 1fr) 45px;
	grid-template-rows: minmax(0, 1fr);

	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;

export const Header = styled.div``;

export const Body = styled.div``;
