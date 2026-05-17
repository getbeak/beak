import type { MenuEventCode } from '@beak/common/web-contents/types';
import { useMenuActionDispatcher } from '@beak/ui/hooks/use-application-menu-event-listener';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { ipcBeakHubService } from '@beak/ui/lib/ipc';
import type { Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

type MenuAction =
	| {
			kind: 'command';
			label: string;
			code: MenuEventCode;
			shortcut?: Shortcuts;
			requiresProject?: boolean;
			/**
			 * Only relevant in the web shell. When set, the menu item disables
			 * unless the currently-bound project lives in OPFS browser storage
			 * — exporting an already-local project does nothing useful.
			 */
			requiresBrowserStorage?: boolean;
	  }
	| { kind: 'link'; label: string; href: string; external?: boolean }
	| { kind: 'separator' };

interface TopMenu {
	label: string;
	items: MenuAction[];
}

const MENUS: TopMenu[] = [
	{
		label: 'File',
		items: [
			{ kind: 'command', label: 'New request', code: 'new_request', shortcut: 'menu-bar.file.new-request' },
			{ kind: 'command', label: 'New folder', code: 'new_folder', shortcut: 'menu-bar.file.new-folder' },
			{ kind: 'separator' },
			{ kind: 'command', label: 'Project Home', code: 'show_project_home', requiresProject: true },
			{ kind: 'command', label: 'Import OpenAPI spec…', code: 'import_openapi_spec', requiresProject: true },
			{ kind: 'command', label: 'Export OpenAPI spec…', code: 'export_openapi_spec', requiresProject: true },
			{ kind: 'command', label: 'View project encryption', code: 'view_project_encryption', requiresProject: true },
			{ kind: 'separator' },
			{
				kind: 'command',
				label: 'Save to local folder…',
				code: 'export_to_local_folder',
				requiresProject: true,
				requiresBrowserStorage: true,
			},
			{ kind: 'separator' },
			{ kind: 'command', label: 'Preferences…', code: 'show_preferences' },
		],
	},
	{
		label: 'Edit',
		items: [
			{
				kind: 'command',
				label: 'Execute current request',
				code: 'execute_request',
				shortcut: 'global.execute-request',
				requiresProject: true,
			},
		],
	},
	{
		label: 'View',
		items: [
			{ kind: 'command', label: 'Close tab', code: 'close_tab', shortcut: 'tab-bar.current.close' },
			{ kind: 'command', label: 'Close all tabs', code: 'close_all_tabs', shortcut: 'tab-bar.all.close' },
			{ kind: 'command', label: 'Close other tabs', code: 'close_other_tabs', shortcut: 'tab-bar.all.close-others' },
			{ kind: 'separator' },
			{ kind: 'command', label: 'Select next tab', code: 'select_next_tab', shortcut: 'tab-bar.all.next' },
			{ kind: 'command', label: 'Select previous tab', code: 'select_previous_tab', shortcut: 'tab-bar.all.previous' },
			{ kind: 'separator' },
			{ kind: 'command', label: 'Toggle sidebar', code: 'toggle_sidebar', shortcut: 'sidebar.toggle-view' },
			{ kind: 'command', label: 'Show project sidebar', code: 'sidebar_show_project', shortcut: 'sidebar.switch-project' },
			{
				kind: 'command',
				label: 'Show variables sidebar',
				code: 'sidebar_show_variables',
				shortcut: 'sidebar.switch-variables',
			},
			{
				kind: 'command',
				label: 'Show extensions sidebar',
				code: 'sidebar_show_extensions',
				shortcut: 'sidebar.switch-extensions',
			},
		],
	},
	{
		label: 'Help',
		items: [
			{ kind: 'command', label: 'Get started', code: 'show_new_project_intro' },
			{ kind: 'command', label: 'Show all commands', code: 'show_omni_commands', shortcut: 'omni-bar.launch.commands' },
			{ kind: 'separator' },
			{ kind: 'link', label: 'Beak manual', href: 'https://docs.getbeak.app', external: true },
			{ kind: 'link', label: 'Release notes', href: 'https://github.com/getbeak/beak/releases', external: true },
			{ kind: 'separator' },
			{
				kind: 'link',
				label: 'Join Slack community',
				href: 'https://join.slack.com/t/beakapp/shared_invite/zt-17egog9mp-Zy5nAengWuJCdPud3Y1idA',
				external: true,
			},
			{ kind: 'link', label: 'Join us on Twitter', href: 'https://twitter.com/beakapp', external: true },
			{ kind: 'link', label: 'Report issue', href: 'mailto:support@getbeak.app' },
			{ kind: 'separator' },
			{ kind: 'link', label: 'View terms', href: 'https://getbeak.app/legal/terms', external: true },
			{ kind: 'link', label: 'View privacy statement', href: 'https://getbeak.app/legal/privacy', external: true },
		],
	},
];

const TriggerButton = chakra('button');

const WebMenuBar: React.FC = () => {
	const dispatchMenuCode = useMenuActionDispatcher();
	const [openMenu, setOpenMenu] = useState<string | null>(null);

	const projectLoaded = useAppSelector(s => s.global.project.loaded);
	const projectMode = useAppSelector(s => s.global.project.mode);
	const projectLoadError = useAppSelector(s => s.global.project.loadError);
	const variableSetsLoaded = useAppSelector(s => s.global.variableSets.loaded);
	const tabsLoaded = useAppSelector(s => s.features.tabs.loaded);

	const everythingLoaded = projectLoaded && variableSetsLoaded && tabsLoaded;
	const isLoading = !projectLoadError && !everythingLoaded;
	const hasProject = everythingLoaded && projectMode !== 'none';

	// Browser-storage detection: the export item is only meaningful for
	// disk-mode projects that still live in the OPFS sandbox. Refetch on
	// project changes (the bound project can swap when the window navigates
	// between `/` and `/project/<id>`).
	const [browserStorage, setBrowserStorage] = useState(false);
	useEffect(() => {
		if (projectMode !== 'disk') {
			setBrowserStorage(false);
			return;
		}
		let cancelled = false;
		void (async () => {
			try {
				const source = await ipcBeakHubService.getRootSource();
				if (!cancelled) setBrowserStorage(source === 'browser');
			} catch {
				if (!cancelled) setBrowserStorage(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [projectMode]);

	return (
		<Flex
			as='nav'
			role='menubar'
			aria-label='Application menu'
			align='center'
			h='28px'
			px='1'
			bg='bg.surface'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			gap='0'
			flexShrink={0}
			userSelect='none'
		>
			<Box
				pl='2'
				pr='3'
				fontSize='11px'
				fontWeight='700'
				letterSpacing='0.06em'
				textTransform='uppercase'
				color='accent.pink'
			>
				Beak
			</Box>

			{!isLoading &&
				MENUS.map(menu => {
					const isOpen = openMenu === menu.label;

					return (
						<Menu.Root
							key={menu.label}
							open={isOpen}
							onOpenChange={e => {
								setOpenMenu(prev => {
									if (e.open) return menu.label;
									return prev === menu.label ? null : prev;
								});
							}}
							positioning={{ placement: 'bottom-start', gutter: 4 }}
						>
							<Menu.Trigger asChild>
								<TriggerButton
									type='button'
									role='menuitem'
									onMouseEnter={() => {
										// Standard menu-bar hover-switch: only "follow the mouse"
										// between triggers if a sibling is already open.
										if (openMenu !== null && openMenu !== menu.label) setOpenMenu(menu.label);
									}}
									h='22px'
									px='2'
									borderRadius='sm'
									bg='transparent'
									color='fg.default'
									fontSize='12px'
									fontWeight='500'
									cursor='pointer'
									transition='background-color .1s linear, color .1s linear'
									_hover={{
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
									}}
									_focusVisible={{
										outline: 'none',
										bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
										color: 'accent.pink',
									}}
									_open={{
										bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
										color: 'accent.pink',
									}}
								>
									{menu.label}
								</TriggerButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='220px'>
										{menu.items.map((item, idx) => {
											if (item.kind === 'separator') {
												return <Menu.Separator key={`sep-${idx}`} my='1' borderColor='border.subtle' />;
											}

											if (item.kind === 'link') {
												return (
													<Menu.Item
														key={item.label}
														value={item.label}
														asChild
														fontSize='12px'
														fontWeight='500'
														borderRadius='sm'
														py='1.5'
														px='2'
														color='fg.default'
														_hover={{
															bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
														}}
													>
														<chakra.a
															href={item.href}
															target={item.external ? '_blank' : undefined}
															rel={item.external ? 'noopener noreferrer' : undefined}
														>
															<Menu.ItemText>{item.label}</Menu.ItemText>
														</chakra.a>
													</Menu.Item>
												);
											}

											const shortcut = item.shortcut ? renderPlainTextDefinition(item.shortcut) : undefined;
											const disabled =
												(Boolean(item.requiresProject) && !hasProject) || (Boolean(item.requiresBrowserStorage) && !browserStorage);

											return (
												<Menu.Item
													key={item.code}
													value={item.code}
													disabled={disabled}
													onClick={() => {
														if (disabled) return;
														dispatchMenuCode(item.code);
													}}
													fontSize='12px'
													fontWeight='500'
													borderRadius='sm'
													py='1.5'
													px='2'
													color='fg.default'
													gap='4'
													_hover={{
														bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
													}}
													_disabled={{
														color: 'fg.disabled',
														cursor: 'not-allowed',
														_hover: { bg: 'transparent' },
													}}
												>
													<Menu.ItemText>{item.label}</Menu.ItemText>
													{shortcut && (
														<Menu.ItemCommand
															fontSize='10px'
															fontWeight='500'
															color={disabled ? 'fg.disabled' : 'fg.muted'}
															letterSpacing='0.04em'
														>
															{shortcut}
														</Menu.ItemCommand>
													)}
												</Menu.Item>
											);
										})}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.Root>
					);
				})}
		</Flex>
	);
};

export default WebMenuBar;
