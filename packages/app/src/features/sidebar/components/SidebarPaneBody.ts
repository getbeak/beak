import styled from 'styled-components';

const SidebarPaneBody = styled.div<{ $collapsed?: boolean }>`
	padding: 4px 5px;
	padding-right: 3px;

	flex-shrink: 0;
	overflow-y: scroll;

	${p => p.$collapsed && 'background: pink;'}
`;

export default SidebarPaneBody;
