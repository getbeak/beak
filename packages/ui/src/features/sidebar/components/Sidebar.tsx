import { Box, Grid } from '@chakra-ui/react';
import type { SidebarVariant } from '@beak/common/types/beak-hub';
import type { MenuEventPayload } from '@beak/common/web-contents/types';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import ProjectPane from '../../project-pane/components/ProjectPane';
import VariablesPane from '../../variables-sets/components/VariablesPane';
import SidebarMenuHighlighter from './molecules/SidebarMenuHighlighter';
import SidebarMenuItem from './molecules/SidebarMenuItem';

const sidebarVariants: SidebarVariant[] = ['project', 'variables'];

const Sidebar: React.FC = () => {
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
			switch (payload.code) {
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
				default:
					break;
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
		<Grid
			position='relative'
			templateColumns='40px 1fr'
			h='calc(100% - 72px)'
			pt='72px'
			bg='color-mix(in srgb, var(--beak-colors-bg-canvas) 75%, transparent)'
			overflow='hidden'
		>
			<Box
				position='absolute'
				top='0'
				left='0'
				right='0'
				h='71px'
				bg={sidebarCollapsed ? 'bg.surface.emphasized' : undefined}
				borderBottomWidth={sidebarCollapsed ? '1px' : undefined}
				borderBottomColor={sidebarCollapsed ? 'border.default' : undefined}
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			/>
			{sidebarCollapsed && (
				<Box
					position='absolute'
					top='0'
					left='0'
					right='0'
					h='71px'
					bgImage="url('images/logo.svg')"
					bgPos='center 85%'
					bgSize='20px'
					bgRepeat='no-repeat'
					transform='scaleX(-1)'
				/>
			)}
			<Box
				position='relative'
				w='10'
				borderRightWidth={sidebarCollapsed ? '2px' : undefined}
				borderRightColor={sidebarCollapsed ? 'border.default' : undefined}
			>
				<SidebarMenuHighlighter hidden={sidebarCollapsed} index={variantIndex} />
				<SidebarMenuItem
					item='project'
					name='Project'
					selectedItem={selectedSidebar}
					shortcut='sidebar.switch-project'
					onClick={usefulSetVariant}
				/>
				<SidebarMenuItem
					item='variables'
					name='Variables'
					selectedItem={selectedSidebar}
					shortcut='sidebar.switch-variables'
					onClick={usefulSetVariant}
				/>
			</Box>

			{selectedSidebar === 'project' && <ProjectPane />}
			{selectedSidebar === 'variables' && <VariablesPane />}
		</Grid>
	);
};

export default Sidebar;
