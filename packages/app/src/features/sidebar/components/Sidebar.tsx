import React, { useState } from 'react';
import { faFolderTree } from '@fortawesome/free-solid-svg-icons/faFolderTree';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons/faKeyboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

import ProjectPane from '../../project-pane/components/ProjectPane';
import SidebarMenuItem, { SidebarVariant } from './molecules/SidebarMenuItem';

interface SidebarProps {
	onSidebarCollapseChanged: (collapsed: boolean) => void;
}

const Sidebar: React.FunctionComponent<SidebarProps> = props => {
	const { onSidebarCollapseChanged } = props;
	const theme = useTheme();
	const [variant, setVariant] = useState<SidebarVariant | null>('project');

	function usefulSetVariant(newVariant: SidebarVariant) {
		if (variant === newVariant) {
			setVariant(null);
			onSidebarCollapseChanged(true);
		} else {
			setVariant(newVariant);
			onSidebarCollapseChanged(false);
		}
	}

	return (
		<Container>
			<SidebarMenu>
				<SidebarMenuItem
					item={'project'}
					selectedItem={variant}
					onClick={usefulSetVariant}
				>
					<FontAwesomeIcon
						icon={faFolderTree}
						color={theme.ui.blankFill}
						fontSize={'14px'}
					/>
				</SidebarMenuItem>
				<SidebarMenuItem
					item={'variables'}
					selectedItem={variant}
					onClick={usefulSetVariant}
				>
					<FontAwesomeIcon
						icon={faKeyboard}
						color={theme.ui.blankFill}
						fontSize={'14px'}
					/>
				</SidebarMenuItem>
			</SidebarMenu>

			{variant === 'project' && <ProjectPane />}
		</Container>
	);
};

const Container = styled.div`
	display: grid;
	grid-template-columns: 40px 1fr;
	height: calc(100% - 72px);
	margin-top: 71px;
	/* border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator}; */
`;

const SidebarMenu = styled.div`
	width: 40px;
`;

export default Sidebar;
