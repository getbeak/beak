import styled from 'styled-components';

export const Title = styled.div`
	font-size: 30px;
	font-weight: 700;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export const TitleSubtle = styled(Title)`
	font-size: 20px;
	line-height: 24px;
	color: ${p => p.theme.ui.textMinor};
`;

export const SubTitle = styled.div`
	font-size: 16px;
	margin-top: 5px;
	color: ${p => p.theme.ui.textMinor};
`;

export const BodyRegular = styled.div`
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export const BodyBold = styled.div`
	font-weight: 600;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
