import styled from 'styled-components';

export const Title = styled.div`
	font-size: 40px;
	font-weight: 700;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export const SubTitle = styled.div`
	font-size: 16px;
	margin-top: 10px;
	color: ${p => p.theme.ui.textMinor};
`;
