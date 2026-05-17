import tabActions from '@beak/ui/features/tabs/store/actions';
import { ipcExplorerService, ipcPreferencesService, ipcWindowService } from '@beak/ui/lib/ipc';
import { reloadExtensions } from '@beak/ui/store/extensions/actions';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { closeTabIntent } from '@beak/ui/store/project/actions';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import {
	ArrowLeft,
	ArrowRight,
	Bug,
	Cookie,
	FolderOpen,
	Home,
	Layers,
	type LucideIcon,
	Monitor,
	Moon,
	PanelLeft,
	Pin,
	Power,
	Puzzle,
	Sparkles,
	Sun,
	Table,
	Trash2,
	Workflow as WorkflowIcon,
	X,
} from 'lucide-react';
import type { Dispatch } from 'redux';

export interface CommandContext {
	sidebar: { collapsed: boolean };
}

export interface CommandDescriptor {
	id: string;
	category: 'Tabs' | 'Sidebar' | 'View' | 'Workflows' | 'Preferences' | 'Extensions' | 'Developer';
	name: string;
	keywords: string[];
	icon: LucideIcon;
	action: (dispatch: Dispatch) => void;
}

export function buildCommandRegistry(context: CommandContext): CommandDescriptor[] {
	return [
		{
			id: 'developer:reload_window',
			category: 'Developer',
			name: 'Reload window',
			icon: Power,
			keywords: ['refresh'],
			action: () => window.location.reload(),
		},
		{
			id: 'developer:toggle_developer_tools',
			category: 'Developer',
			name: 'Toggle developer tools',
			icon: Bug,
			keywords: ['devtools', 'inspect'],
			action: () => ipcWindowService.toggleDeveloperTools(),
		},

		{
			id: 'extensions:reload_all_extensions',
			category: 'Extensions',
			name: 'Reload all extensions',
			icon: Puzzle,
			keywords: ['plugin'],
			action: dispatch => dispatch(reloadExtensions()),
		},
		{
			id: 'extensions:open_extensions_folder',
			category: 'Extensions',
			name: 'Open extensions folder',
			icon: FolderOpen,
			keywords: ['plugin', 'finder'],
			action: () => ipcExplorerService.revealFile('extensions/'),
		},

		{
			id: 'preferences:switch_to_light_theme',
			category: 'Preferences',
			name: 'Switch to light theme',
			icon: Sun,
			keywords: ['theme', 'mode'],
			action: () => ipcPreferencesService.switchThemeMode('light'),
		},
		{
			id: 'preferences:switch_to_dark_theme',
			category: 'Preferences',
			name: 'Switch to dark theme',
			icon: Moon,
			keywords: ['theme', 'mode'],
			action: () => ipcPreferencesService.switchThemeMode('dark'),
		},
		{
			id: 'preferences:switch_to_system_theme',
			category: 'Preferences',
			name: 'Switch to system theme',
			icon: Monitor,
			keywords: ['theme', 'mode'],
			action: () => ipcPreferencesService.switchThemeMode('system'),
		},

		{
			id: 'tabs:visit_next_tab',
			category: 'Tabs',
			name: 'Next tab',
			icon: ArrowRight,
			keywords: ['cycle'],
			action: dispatch => dispatch(tabActions.changeTabNext()),
		},
		{
			id: 'tabs:visit_previous_tab',
			category: 'Tabs',
			name: 'Previous tab',
			icon: ArrowLeft,
			keywords: ['cycle'],
			action: dispatch => dispatch(tabActions.changeTabPrevious()),
		},
		{
			id: 'tabs:make_current_tab_permanent',
			category: 'Tabs',
			name: 'Pin current tab',
			icon: Pin,
			keywords: ['permanent', 'stick'],
			action: dispatch => dispatch(tabActions.makeTabPermanent()),
		},
		{
			id: 'tabs:close_current_tab',
			category: 'Tabs',
			name: 'Close current tab',
			icon: X,
			keywords: [],
			action: dispatch => dispatch(closeTabIntent(undefined)),
		},
		{
			id: 'tabs:close_other_tabs',
			category: 'Tabs',
			name: 'Close other tabs',
			icon: Trash2,
			keywords: [],
			action: dispatch => dispatch(tabActions.closeTabsOther()),
		},
		{
			id: 'tabs:close_tabs_to_the_left',
			category: 'Tabs',
			name: 'Close tabs to the left',
			icon: ArrowLeft,
			keywords: [],
			action: dispatch => dispatch(tabActions.closeTabsLeft()),
		},
		{
			id: 'tabs:close_tabs_to_the_right',
			category: 'Tabs',
			name: 'Close tabs to the right',
			icon: ArrowRight,
			keywords: [],
			action: dispatch => dispatch(tabActions.closeTabsRight()),
		},
		{
			id: 'tabs:close_all_tabs',
			category: 'Tabs',
			name: 'Close all tabs',
			icon: Trash2,
			keywords: [],
			action: dispatch => dispatch(tabActions.closeTabsAll()),
		},

		{
			id: 'view:view_getting_started',
			category: 'View',
			name: 'Getting started',
			icon: Layers,
			keywords: ['welcome', 'intro'],
			action: dispatch =>
				dispatch(tabActions.changeTab({ type: 'new_project_intro', temporary: false, payload: 'new_project_intro' })),
		},
		{
			id: 'view:open_project_home',
			category: 'View',
			name: 'Open project home',
			icon: Home,
			keywords: ['openapi', 'sync', 'sources', 'dashboard'],
			action: dispatch =>
				dispatch(tabActions.changeTab({ type: 'project_home', temporary: false, payload: 'project_home' })),
		},
		{
			id: 'view:open_cookie_jar',
			category: 'View',
			name: 'Open cookie jar',
			icon: Cookie,
			keywords: ['cookies', 'jar', 'session', 'set-cookie'],
			action: dispatch => dispatch(tabActions.changeTab({ type: 'cookie_jar', temporary: false, payload: 'cookie_jar' })),
		},

		{
			id: 'workflows:new_blank',
			category: 'Workflows',
			name: 'New workflow (blank)',
			icon: WorkflowIcon,
			keywords: ['create', 'add'],
			action: dispatch => dispatch(workflowActions.createNewWorkflow({ template: 'blank' })),
		},
		{
			id: 'workflows:new_smoke_test',
			category: 'Workflows',
			name: 'New workflow from smoke-test template',
			icon: Sparkles,
			keywords: ['create', 'template', 'smoke', 'starter'],
			action: dispatch => dispatch(workflowActions.createNewWorkflow({ template: 'smoke-test' })),
		},
		{
			id: 'workflows:new_auth_chain',
			category: 'Workflows',
			name: 'New workflow from auth-chain template',
			icon: Sparkles,
			keywords: ['create', 'template', 'auth', 'login', 'starter'],
			action: dispatch => dispatch(workflowActions.createNewWorkflow({ template: 'auth-chain' })),
		},
		{
			id: 'workflows:new_paginated_fetch',
			category: 'Workflows',
			name: 'New workflow from paginated-fetch template',
			icon: Sparkles,
			keywords: ['create', 'template', 'paginate', 'loop', 'starter'],
			action: dispatch => dispatch(workflowActions.createNewWorkflow({ template: 'paginated-fetch' })),
		},

		{
			id: 'sidebar:toggle_visibility',
			category: 'Sidebar',
			name: 'Toggle sidebar',
			icon: PanelLeft,
			keywords: ['hide', 'show'],
			action: dispatch => {
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: !context.sidebar.collapsed }));
			},
		},
		{
			id: 'sidebar:switch_to_project',
			category: 'Sidebar',
			name: 'Switch to project pane',
			icon: FolderOpen,
			keywords: ['tree', 'files'],
			action: dispatch => {
				dispatch(sidebarPreferenceSetSelected('project'));
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
			},
		},
		{
			id: 'sidebar:switch_to_variables',
			category: 'Sidebar',
			name: 'Switch to variables pane',
			icon: Table,
			keywords: ['env', 'variables'],
			action: dispatch => {
				dispatch(sidebarPreferenceSetSelected('variables'));
				dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
			},
		},
	];
}
