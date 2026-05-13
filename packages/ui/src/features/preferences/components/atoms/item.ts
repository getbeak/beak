import styled, { css } from 'styled-components';

export const ItemGroup = styled.div`
	margin-bottom: 20px;
`;

export const ItemLabel = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: var(--beak-colors-fg-muted);
	margin-bottom: 10px;
`;

export const ItemInfo = styled.div`
	font-size: 12px;
	color: var(--beak-colors-fg-subtle);
	margin: 5px 0;
`;

export const ItemSpacer = styled.div`
	height: 5px;
`;

export const SubItemGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: 14px;
`;

export const SubItem = styled.div`
	font-size: 12px;
	color: var(--beak-colors-fg-muted);
`;

export const SubItemLabel = styled.div<{ $abbr?: boolean }>`
	margin-bottom: 3px;

	${p =>
		p.$abbr &&
		css`
		text-decoration: underline;
		text-decoration-style: dotted;
	`}
`;
