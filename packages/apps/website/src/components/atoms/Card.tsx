import styled from 'styled-components';

export const CardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	column-gap: 40px;
	row-gap: 30px;
`;

export const Card = styled.div`
	backdrop-filter: blur(10px);
	border-radius: 25px;
	padding: 35px;
	background: ${p => p.theme.ui.surface}BB;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export const CardIcons = styled.div`
	margin-bottom: 10px;
`;

export const CardTitle = styled.div`
	font-size: 18px;
	font-weight: 600;
`;

export const CardMedia = styled.div``;

export const CardBody = styled.div`
	margin-top: 10px;
	font-size: 16px;
	color: ${p => p.theme.ui.textMinor};
`;
