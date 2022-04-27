import styled from 'styled-components';

export const ItemGroup = styled.div`
	margin-bottom: 15px;
`;

export const ItemLabel = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
	margin-bottom: 5px;
`;

export const ItemInfo = styled.div`
	font-size: 14px;
	color: ${p => p.theme.ui.textMinorMuted};
	margin-bottom: 5px;
`;

export const ItemSpacer = styled.div`
	height: 5px;
`;
