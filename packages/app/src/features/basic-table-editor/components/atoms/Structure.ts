import styled from 'styled-components';

export const Row = styled.div`
	display: grid;
	grid-template-columns: 0.8fr 1fr 25px;
	grid-template-rows: 1fr;

	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;

export const Header = styled.div``;

export const Body = styled.div``;
