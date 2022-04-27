import Button from '@beak/app-beak/components/atoms/Button';
import styled from 'styled-components';

export const SubTitle = styled.p`
	text-align: center;
	font-size: 14px;
	color: ${p => p.theme.ui.textMinor};
`;

export const ActionContainer = styled.div`
	margin: 10px auto;
	height: 150px;
	max-width: 250px;
	-webkit-app-region: no-drag;

	> ${Button} {
		margin-top: 10px;
		width: 100%;
	}
`;

export const Error = styled.div`
	padding: 5px 0;
	color: ${p => p.theme.ui.textAlert};
	font-size: 12px;
`;
