import styled from 'styled-components';

export const SubTitle = styled.p`
	text-align: center;
	font-size: 14px;
	color: var(--beak-colors-fg-muted);
`;

export const ActionContainer = styled.div`
	margin: 10px auto;
	height: 150px;
	max-width: 250px;
	-webkit-app-region: no-drag;

	> button {
		margin-top: 10px;
		width: 100%;
	}
`;

export const Error = styled.div`
	padding: 5px 0;
	color: var(--beak-colors-accent-alert);
	font-size: 12px;
`;
