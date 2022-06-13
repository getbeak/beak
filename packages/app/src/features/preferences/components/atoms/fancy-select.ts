import { ThemeMode } from '@beak/common/types/theme';
import styled, { css } from 'styled-components';

export const SelectContainer = styled.div`
	margin: 10px 0;
	display: inline-flex;
	gap: 35px;
	padding: 20px 25px;
	padding-bottom: 15px;
	border-radius: 8px;
	background: ${p => p.theme.ui.surfaceHighlight};
`;

export const SelectItem = styled.div<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;

	color: ${p => p.theme.ui.textMinor};
	opacity: ${p => p.$active ? 1 : 0.6};
	font-size: 14px;
	cursor: pointer;
`;

export const SelectItemPreview = styled.div<{ $active?: boolean; $themeMode: ThemeMode }>`
	width: 90px; height: 56px;
	border-radius: 5px;
	background: pink;
	margin-bottom: 10px;
	border: 2px solid transparent;

	background-image: url('./images/theme-switcher/${p => p.$themeMode}.jpg');
	background-position: center;
	background-size: cover;
	background-repeat: no-repeat;
	${p => p.$active && css`border: 2px solid ${p => p.theme.ui.primaryFill}`}
`;
