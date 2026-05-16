import type { SidebarVariant } from '@beak/common/types/beak-hub';
import type { MenuEventPayload } from '@beak/common/web-contents/types';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { actions as projectActions } from '@beak/ui/store/project';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as variableSetActions } from '@beak/ui/store/variable-sets';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { FilePlus, FolderPlus, Plus } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import EndpointsPane from '../../endpoints/components/EndpointsPane';
import ExtensionsPane from '../../extension/components/ExtensionsPane';
import ProjectPane from '../../project-pane/components/ProjectPane';
import VariablesPane from '../../variables-sets/components/VariablesPane';
import SidebarMenuItem from './molecules/SidebarMenuItem';

const embedded = Boolean(window.embeddedIndicator);
// Electron leans on the BrowserWindow's native `under-window` vibrancy on
// macOS — we keep the surface very transparent so the platform's blur shows
// through. On web (and non-darwin Electron) we approximate the same look
// with a single solid translucent panel + `backdrop-filter: blur(...)`.
// No mesh, no per-section borders — the panel is one slab.
const useNativeVibrancy = embedded;
const ACTIVITY_BAR_WIDTH = 48;

const ChakraButton = chakra('button');

const ViewActionButton: React.FC<
	React.PropsWithChildren<{
		'aria-label': string;
		title: string;
		onClick: () => void;
	}>
> = ({ children, onClick, ...rest }) => (
	<ChakraButton
		type='button'
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		w='22px'
		h='22px'
		borderRadius='sm'
		bg='transparent'
		color='fg.muted'
		cursor='pointer'
		transition='color .1s linear, background-color .1s linear'
		_hover={{
			color: 'fg.default',
			bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
		}}
		_focusVisible={{
			outline: 'none',
			color: 'fg.default',
			boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)',
		}}
		onClick={onClick}
		{...rest}
	>
		{children}
	</ChakraButton>
);

const Sidebar: React.FC = () => {
	const selectedSidebar = useAppSelector(s => s.global.preferences.sidebar.selected);
	const sidebarCollapsed = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const dispatch = useDispatch();

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
				case checkShortcut('sidebar.switch-endpoints', event):
					event.stopPropagation();
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('endpoints'));
					break;
				case checkShortcut('sidebar.switch-extensions', event):
					event.stopPropagation();
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('extensions'));
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
				case 'sidebar_show_endpoints':
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('endpoints'));
					break;
				case 'sidebar_show_extensions':
					dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
					dispatch(sidebarPreferenceSetSelected('extensions'));
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

	function handleActivityClick(newVariant: SidebarVariant) {
		if (selectedSidebar === newVariant) {
			dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !sidebarCollapsed }));
		} else {
			dispatch(sidebarPreferenceSetSelected(newVariant));
			dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
		}
	}

	const topSpacer = embedded ? 36 : 0;
	const title =
		selectedSidebar === 'variables' ? 'Variables'
			: selectedSidebar === 'endpoints' ? 'Endpoints'
				: selectedSidebar === 'extensions' ? 'Extensions'
					: 'Explorer';

	return (
		<Box position='relative' h='100%' w='100%' overflow='hidden'>
			{/* Vibrancy emulation: a heavily-blurred translucent panel sits
				over whatever's behind the sidebar — on electron that's the
				BrowserWindow vibrancy, on web it's the root mesh from
				WebProjectMain. Either way the surface picks up colour from
				below the way macOS vibrancy does. */}
			<Box
				position='absolute'
				inset='0'
				zIndex={1}
				pointerEvents='none'
				backdropFilter={useNativeVibrancy ? undefined : 'blur(40px) saturate(120%)'}
				css={{
					// Light mode keeps the panel quite opaque — the mesh shows
					// up as faint hue-shift in the blurred panel, not as a
					// foreground tint. Dark mode leans more transparent so the
					// mesh actually peeks through.
					background: useNativeVibrancy
						? 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 55%, transparent)'
						: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 92%, transparent)',
					'.dark &': {
						background: useNativeVibrancy
							? 'color-mix(in srgb, var(--beak-colors-gray-850) 60%, transparent)'
							: 'color-mix(in srgb, var(--beak-colors-gray-900) 78%, transparent)',
					},
				}}
			/>
			<Flex position='relative' zIndex={2} h='100%' w='100%'>
				<Flex
					as='nav'
					aria-label='Activity bar'
					direction='column'
					flexShrink={0}
					w={`${ACTIVITY_BAR_WIDTH}px`}
					pt={`${topSpacer}px`}
					style={embedded ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
				>
					<Box style={embedded ? ({ WebkitAppRegion: 'no-drag' } as React.CSSProperties) : undefined}>
						<SidebarMenuItem
							item='project'
							name='Project'
							selectedItem={sidebarCollapsed ? null : selectedSidebar}
							shortcut='sidebar.switch-project'
							onClick={handleActivityClick}
						/>
						<SidebarMenuItem
							item='variables'
							name='Variables'
							selectedItem={sidebarCollapsed ? null : selectedSidebar}
							shortcut='sidebar.switch-variables'
							onClick={handleActivityClick}
						/>
						<SidebarMenuItem
							item='endpoints'
							name='Endpoints'
							selectedItem={sidebarCollapsed ? null : selectedSidebar}
							shortcut='sidebar.switch-endpoints'
							onClick={handleActivityClick}
						/>
						<SidebarMenuItem
							item='extensions'
							name='Extensions'
							selectedItem={sidebarCollapsed ? null : selectedSidebar}
							shortcut='sidebar.switch-extensions'
							onClick={handleActivityClick}
						/>
					</Box>
				</Flex>

				{!sidebarCollapsed && (
					<Flex direction='column' flex='1' minW={0} overflow='hidden'>
						{embedded && (
							<Box h={`${topSpacer}px`} flexShrink={0} style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
						)}
						<Flex
							align='center'
							h='35px'
							flexShrink={0}
							pl='4'
							pr='2'
							gap='1'
							css={{
								'&:hover [data-view-actions], &:focus-within [data-view-actions]': { opacity: 1 },
							}}
						>
							<Box
								flex='1'
								minW={0}
								color='fg.default'
								fontSize='11px'
								fontWeight='600'
								textTransform='uppercase'
								letterSpacing='0.04em'
								whiteSpace='nowrap'
								overflow='hidden'
								textOverflow='ellipsis'
								title={title}
							>
								{title}
							</Box>
							<Flex data-view-actions align='center' gap='0.5' opacity={0} transition='opacity .12s ease'>
								{selectedSidebar === 'project' && (
									<React.Fragment>
										<ViewActionButton
											aria-label='New request'
											title='New request'
											onClick={() => {
												dispatch(projectActions.createNewRequest({ highlightedNodeId: undefined }));
											}}
										>
											<FilePlus size={13} strokeWidth={1.8} />
										</ViewActionButton>
										<ViewActionButton
											aria-label='New folder'
											title='New folder'
											onClick={() => {
												dispatch(projectActions.createNewFolder({ highlightedNodeId: undefined }));
											}}
										>
											<FolderPlus size={13} strokeWidth={1.8} />
										</ViewActionButton>
									</React.Fragment>
								)}
								{selectedSidebar === 'variables' && (
									<ViewActionButton
										aria-label='New variable set'
										title='New variable set'
										onClick={() => {
											dispatch(variableSetActions.createNewVariableSet({}));
											dispatch(
												changeTab({
													type: 'variable_set_editor',
													payload: 'New variable set',
													temporary: false,
												}),
											);
										}}
									>
										<Plus size={14} strokeWidth={2} />
									</ViewActionButton>
								)}
							</Flex>
						</Flex>
						<Box flex='1' minH={0} display='flex' flexDirection='column' overflow='hidden'>
							{selectedSidebar === 'project' && <ProjectPane />}
							{selectedSidebar === 'variables' && <VariablesPane />}
							{selectedSidebar === 'endpoints' && <EndpointsPane />}
							{selectedSidebar === 'extensions' && <ExtensionsPane />}
						</Box>
					</Flex>
				)}
			</Flex>
		</Box>
	);
};

export default Sidebar;
