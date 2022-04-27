import styled from 'styled-components';

export const Wrapper = styled.div`
	text-align: center;
	height: 100%;
	background: ${p => p.theme.ui.background};
	padding: 20px 25px;
`;

export const Header = styled.h1`
	margin: 0;
	font-weight: 400;
	font-size: 35px;
	line-height: 25px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export const Body = styled.p`
	font-size: 14px;
	color: ${p => p.theme.ui.textOnFill};
`;
