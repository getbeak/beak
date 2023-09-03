import { toHexAlpha } from '@beak/design-system/utils';
import styled from 'styled-components';

const SidebarSectionCard = styled.div`
	padding: 8px 10px;

	border-radius: 8px;
	text-align: center;
	font-size: 13px;

	background: ${p => toHexAlpha(p.theme.ui.surface, 0.5)};
	backdrop-filter: blur(10px);
`;

export default SidebarSectionCard;
