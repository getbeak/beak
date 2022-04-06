import React, { useContext, useState } from 'react';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { faFolderTree } from '@fortawesome/free-solid-svg-icons/faFolderTree';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons/faKeyboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

import ProjectPane from '../../project-pane/components/ProjectPane';
import SidebarMenuHighlighter from './molecules/SidebarMenuHighlighter';
import SidebarMenuItem, { SidebarVariant } from './molecules/SidebarMenuItem';

const sidebarVariants: SidebarVariant[] = ['project', 'variables'];

interface SidebarProps {
	onSidebarCollapseChanged: (collapsed: boolean) => void;
}

const Sidebar: React.FunctionComponent<SidebarProps> = props => {
	const { onSidebarCollapseChanged } = props;
	const theme = useTheme();
	const windowSession = useContext(WindowSessionContext);
	const [variant, setVariant] = useState<SidebarVariant | null>('project');
	const variantIndex = (sidebarVariants as unknown[]).indexOf(variant);

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
		<Container $darwin={windowSession.isDarwin()}>
			<SidebarMenu>
				<SidebarMenuHighlighter currentIndex={variantIndex} />

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

const Container = styled.div<{ $darwin: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 40px 1fr;
	height: calc(100% - 72px);
	margin-top: 71px;
	background: ${p => p.$darwin ? 'transparent' : p.theme.ui.background};
`;

const SidebarMenu = styled.div`
	width: 40px;
`;

export default Sidebar;
