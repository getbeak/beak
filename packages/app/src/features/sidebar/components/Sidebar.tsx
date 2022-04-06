import React, { useContext, useEffect, useState } from 'react';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { MenuEventPayload } from '@beak/common/web-contents/types';
import styled from 'styled-components';

import ProjectPane from '../../project-pane/components/ProjectPane';
import VariablesPane from '../../variables/components/VariablesPane';
import SidebarMenuHighlighter from './molecules/SidebarMenuHighlighter';
import SidebarMenuItem, { SidebarVariant } from './molecules/SidebarMenuItem';

const sidebarVariants: SidebarVariant[] = ['project', 'variables'];

interface SidebarProps {
	onSidebarCollapseChanged: (collapsed: boolean) => void;
}

const Sidebar: React.FunctionComponent<SidebarProps> = props => {
	const { onSidebarCollapseChanged } = props;
	const windowSession = useContext(WindowSessionContext);

	// TODO(afr): Remove this
	// const [variant, setVariant] = useState<SidebarVariant>('project');
	const [variant, setVariant] = useState<SidebarVariant>('variables');
	const [collapsed, setCollapsed] = useState(false);
	const variantIndex = sidebarVariants.indexOf(variant);

	function setCollapsedProxy(value: boolean) {
		setCollapsed(value);
		onSidebarCollapseChanged(value);
	}

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			switch (true) {
				case checkShortcut('sidebar.toggle-view', event):
					event.stopPropagation();
					setCollapsedProxy(!collapsed);

					break;

				default:
					return;
			}

			event.preventDefault();
		};

		function listener(_event: unknown, payload: MenuEventPayload) {
			const { code } = payload;

			if (code !== 'toggle_sidebar')
				return;

			setCollapsedProxy(!collapsed);
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.secureBridge.ipc.off('menu:menu_item_click', listener);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [collapsed]);

	function usefulSetVariant(newVariant: SidebarVariant) {
		if (variant === newVariant) {
			setCollapsedProxy(!collapsed);
		} else {
			setVariant(newVariant);
			setCollapsedProxy(false);
		}
	}

	return (
		<Container $darwin={windowSession.isDarwin()}>
			<DragBar />
			<SidebarMenu>
				<SidebarMenuHighlighter hidden={collapsed} index={variantIndex} />

				<SidebarMenuItem
					item={'project'}
					selectedItem={variant}
					onClick={usefulSetVariant}
				/>
				<SidebarMenuItem
					item={'variables'}
					selectedItem={variant}
					onClick={usefulSetVariant}
				/>
			</SidebarMenu>

			{variant === 'project' && <ProjectPane />}
			{variant === 'variables' && <VariablesPane />}
		</Container>
	);
};

const Container = styled.div<{ $darwin: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 40px 1fr;
	height: calc(100% - 72px);
	padding-top: 71px;
	background: ${p => p.$darwin ? 'transparent' : p.theme.ui.background};
`;

const DragBar = styled.div`
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 71px;
	-webkit-app-region: drag;
`;

const SidebarMenu = styled.div`
	position: relative;
	width: 40px;
`;

export default Sidebar;
