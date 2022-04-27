import styled, { css } from 'styled-components';

export const SelectContainer = styled.div`
	margin: 10px 0;
	display: inline-flex;
	gap: 35px;
	padding: 20px 25px;
	padding-bottom: 15px;
	border-radius: 8px;
	background: ${p => p.theme.ui.surfaceFill};
`;

export const SelectItem = styled.div<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;

	color: ${p => p.theme.ui.textMinor};
	opacity: ${p => p.$active ? 1 : 0.6};
	font-size: 14px;
	cursor: not-allowed;
`;

export const SelectItemPreview = styled.div<{ $active?: boolean }>`
	width: 90px; height: 56px;
	border-radius: 5px;
	background: pink;
	margin-bottom: 10px;
	border: 2px solid transparent;

	background: conic-gradient(red, orange, yellow, green, blue);
	${p => p.$active && css`border: 2px solid ${p => p.theme.ui.primaryFill}`}
`;
