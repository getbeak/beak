import styled from 'styled-components';

export const Row = styled.div`
	display: grid;
	grid-template-columns: 0.6fr 35px 1fr 35px;
	grid-template-rows: 1fr;

	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
`;

export const Header = styled.div``;

export const Body = styled.div``;
