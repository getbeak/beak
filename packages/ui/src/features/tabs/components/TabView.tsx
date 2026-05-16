import type { TabItem } from '@beak/common/types/beak-project';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { closeTabIntent } from '@beak/ui/store/project/actions';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import TabBar from '../../../components/atoms/TabBar';
import ErrorBoundary from '../../../components/molecules/ErrorBoundary';
import { TabPresentationContext, useTabPresentationState } from '../contexts/tab-presentation';
import { changeTabNext, changeTabPrevious, closeTabsAll, closeTabsOther } from '../store/actions';
import CookieJarTab from './molecules/CookieJarTab';
import FolderOverviewTab from './molecules/FolderOverviewTab';
import NewProjectIntroTab from './molecules/NewProjectIntroTab';
import PreferencesTab from './molecules/PreferencesTab';
import ProjectHomeTab from './molecules/ProjectHomeTab';
import RequestTab from './molecules/RequestTab';
import VariableInputPlaygroundTab from './molecules/VariableInputPlaygroundTab';
import VariableSetEditorTab from './molecules/VariableSetEditorTab';
import WorkflowEditorTab from './molecules/WorkflowEditorTab';
import Router from './Router';

interface TabViewProps {
	tabs: TabItem[];
	selectedTab: TabItem | undefined;
	rightSlot?: React.ReactNode;
}

function labelForTab(tab: TabItem | undefined): string {
	switch (tab?.type) {
		case 'request':
			return 'Request editor';
		case 'variable_set_editor':
			return 'Variable set editor';
		case 'preferences':
			return 'Preferences';
		case 'new_project_intro':
			return 'Intro';
		case 'project_home':
			return 'Project home';
		case 'folder_overview':
			return 'Folder overview';
		case 'cookie_jar':
			return 'Cookies';
		case 'workflow_editor':
			return 'Workflow editor';
		case 'variable_input_playground':
			return 'Variable input lab';
		default:
			return 'Tab';
	}
}

const embedded = Boolean(typeof window !== 'undefined' && window.embeddedIndicator);

const TabView: React.FC<TabViewProps> = ({ selectedTab, tabs, rightSlot }) => {
	const dispatch = useDispatch();
	const tabPresentation = useTabPresentationState();

	// The Getting Started tab is pinned leftmost — closing it collapses it
	// to an icon-only chip, so the visual stays where the user expects it
	// rather than reflowing the rest of the tab bar.
	const sortedTabs = React.useMemo(() => {
		const intro = tabs.find(t => t.type === 'new_project_intro');
		if (!intro) return tabs;
		return [intro, ...tabs.filter(t => t.type !== 'new_project_intro')];
	}, [tabs]);

	useEffect(() => {
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [selectedTab]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab) return;

		switch (true) {
			case checkShortcut('tab-bar.current.close', event):
				dispatch(closeTabIntent(undefined));
				break;
			case checkShortcut('tab-bar.all.close', event):
				dispatch(closeTabsAll());
				break;
			case checkShortcut('tab-bar.all.close-others', event):
				dispatch(closeTabsOther());
				break;
			case checkShortcut('tab-bar.all.previous', event):
				dispatch(changeTabPrevious());
				break;
			case checkShortcut('tab-bar.all.next', event):
				dispatch(changeTabNext());
				break;
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	return (
		<TabPresentationContext.Provider value={tabPresentation}>
			<Flex direction='column' h='100%'>
				<Flex
					direction='row'
					align='flex-end'
					bg='bg.canvas'
					borderBottomWidth='1px'
					borderBottomStyle='solid'
					borderBottomColor='border.subtle'
					flexShrink={0}
					style={embedded ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties) : undefined}
					css={
						embedded
							? {
									// Anything actually interactive in the tab bar opts out of the
									// window-drag region; empty space (gap after the last tab, etc.)
									// stays draggable so the user can grab the window from there.
									'[role=tab], [role=button], button, a, input, textarea, select, [data-no-drag]':
										{ WebkitAppRegion: 'no-drag' as never },
								}
							: undefined
					}
				>
					<TabBar bg='transparent' px='1.5' flex='1' minW={0} css={{ '& > [role=tab]': { marginRight: '2px' } }}>
						{sortedTabs.map(t => {
							if (t.type === 'request') return <RequestTab key={t.payload} tab={t} />;
							if (t.type === 'variable_set_editor') return <VariableSetEditorTab key={t.payload} tab={t} />;
							if (t.type === 'new_project_intro') return <NewProjectIntroTab key={t.payload} tab={t} />;
							if (t.type === 'preferences') return <PreferencesTab key={t.payload} tab={t} />;
							if (t.type === 'project_home') return <ProjectHomeTab key={t.payload} tab={t} />;
							if (t.type === 'folder_overview') return <FolderOverviewTab key={t.payload} tab={t} />;
							if (t.type === 'cookie_jar') return <CookieJarTab key={t.payload} tab={t} />;
							if (t.type === 'workflow_editor') return <WorkflowEditorTab key={t.payload} tab={t} />;
							if (t.type === 'variable_input_playground') return <VariableInputPlaygroundTab key={t.payload} tab={t} />;
							return null;
						})}
					</TabBar>
					{rightSlot && (
						<Flex flexShrink={0} align='center' h='100%'>
							{rightSlot}
						</Flex>
					)}
				</Flex>

				<Box flex='1' minH={0}>
					<ErrorBoundary key={selectedTab?.payload ?? '__empty__'} variant='panel' label={labelForTab(selectedTab)}>
						<Router selectedTab={selectedTab} />
					</ErrorBoundary>
				</Box>
			</Flex>
		</TabPresentationContext.Provider>
	);
};

export default TabView;
