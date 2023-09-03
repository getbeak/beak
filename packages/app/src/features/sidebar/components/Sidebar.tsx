import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/app/store/preferences/actions';
import { useAppSelector } from '@beak/app/store/redux';
import { SidebarVariant } from '@beak/common/types/beak-hub';
import { MenuEventPayload } from '@beak/common/web-contents/types';
import styled, { css } from 'styled-components';

import ProjectPane from '../../project-pane/components/ProjectPane';
import VariablesPane from '../../variables/components/VariablesPane';
import SidebarMenuHighlighter from './molecules/SidebarMenuHighlighter';
import SidebarMenuItem from './molecules/SidebarMenuItem';

const sidebarVariants: SidebarVariant[] = ['project', 'variables'];

const Sidebar: React.FC<React.PropsWithChildren<unknown>> = () => {
	const windowSession = useContext(WindowSessionContext);
	const selectedSidebar = useAppSelector(s => s.global.preferences.sidebar.selected);
	const sidebarCollapsed = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const dispatch = useDispatch();

	const variantIndex = sidebarVariants.indexOf(selectedSidebar);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			switch (true) {
				case checkShortcut('sidebar.toggle-view', event):
					event.stopPropagation();
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !sidebarCollapsed }));

					break;

				case checkShortcut('sidebar.switch-project', event):
					event.stopPropagation();
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('project'));

					break;

				case checkShortcut('sidebar.switch-variables', event):
					event.stopPropagation();
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('variables'));

					break;

				default:
					return;
			}

			event.preventDefault();
		};

		function listener(_event: unknown, payload: MenuEventPayload) {
			const { code } = payload;

			switch (code) {
				case 'toggle_sidebar':
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !sidebarCollapsed }));
					break;

				case 'sidebar_show_project':
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('project'));
					break;

				case 'sidebar_show_variables':
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('variables'));
					break;

				default: break;
			}
		}

		window.secureBridge.ipc.on('menu:menu_item_click', listener);
		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.secureBridge.ipc.off('menu:menu_item_click', listener);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [dispatch, sidebarCollapsed]);

	function usefulSetVariant(newVariant: SidebarVariant) {
		if (selectedSidebar === newVariant) {
			dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !sidebarCollapsed }));
		} else {
			dispatch(sidebarPreferenceSetSelected(newVariant));
			dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
		}
	}

	return (
		<Container $darwin={windowSession.isDarwin()}>
			<DragBar $collapsed={sidebarCollapsed} />
			{sidebarCollapsed && <CollapsedLogo />}
			<SidebarMenu $collapsed={sidebarCollapsed}>
				<SidebarMenuHighlighter hidden={sidebarCollapsed} index={variantIndex} />

				<SidebarMenuItem
					item={'project'}
					name={'Project'}
					selectedItem={selectedSidebar}
					shortcut={'sidebar.switch-project'}
					onClick={usefulSetVariant}
				/>
				<SidebarMenuItem
					item={'variables'}
					name={'Variables'}
					selectedItem={selectedSidebar}
					shortcut={'sidebar.switch-variables'}
					onClick={usefulSetVariant}
				/>
			</SidebarMenu>

			{selectedSidebar === 'project' && <ProjectPane />}
			{selectedSidebar === 'variables' && <VariablesPane />}
		</Container>
	);
};

const Container = styled.div<{ $darwin: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 40px 1fr;
	height: calc(100% - 72px);
	padding-top: 72px;
	background: ${p => toVibrancyAlpha(p.theme.ui.background, 0.75)};
	overflow: hidden;
`;

const DragBar = styled.div<{ $collapsed: boolean }>`
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 71px;
	-webkit-app-region: drag;

	${p => p.$collapsed && css`
		background: ${p => p.theme.ui.secondarySurface};
		border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	`}
`;

const CollapsedLogo = styled.div`
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 71px;

	background: url('/images/logo.svg');
	background-position: center 85%;
	background-size: 20px;
	background-repeat: no-repeat;
	transform: scaleX(-1);
	/* filter: brightness(0) invert(1); */
`;

const SidebarMenu = styled.div<{ $collapsed: boolean }>`
	position: relative;
	width: 40px;

	${p => p.$collapsed && css`border-right: 2px solid ${p.theme.ui.backgroundBorderSeparator};`}
`;

export default Sidebar;
