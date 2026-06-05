import type { TabItem } from '@beak/common/types/beak-project';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { closeTabIntent } from '@beak/ui/store/project/actions';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import TabBar from '../../../components/atoms/TabBar';
import ErrorBoundary from '../../../components/molecules/ErrorBoundary';
import { TabPresentationContext, useTabPresentationState } from '../contexts/tab-presentation';
import { closeTabsAll, closeTabsOther } from '../store/actions';
import MruSwitcher from './MruSwitcher';
import CookieJarTab from './molecules/CookieJarTab';
import DeadTab, { useDeadTabKind } from './molecules/DeadTab';
import FolderOverviewTab from './molecules/FolderOverviewTab';
import NewProjectIntroTab from './molecules/NewProjectIntroTab';
import PreferencesTab from './molecules/PreferencesTab';
import ProjectHomeTab from './molecules/ProjectHomeTab';
import RequestTab from './molecules/RequestTab';
import TabOverflowMenu from './molecules/TabOverflowMenu';
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
	const barRef = useRef<HTMLDivElement>(null);
	const [clippedPayloads, setClippedPayloads] = useState<Set<string>>(() => new Set());

	// The Getting Started tab is pinned leftmost — closing it collapses it
	// to an icon-only chip, so the visual stays where the user expects it
	// rather than reflowing the rest of the tab bar.
	const sortedTabs = React.useMemo(() => {
		const intro = tabs.find(t => t.type === 'new_project_intro');
		if (!intro) return tabs;
		return [intro, ...tabs.filter(t => t.type !== 'new_project_intro')];
	}, [tabs]);

	// IntersectionObserver-driven overflow detection. The bar element is the
	// root so we get accurate clip ratios as the user scrolls or resizes the
	// window. Tabs map 1:1 to direct children of the bar in DOM order.
	useLayoutEffect(() => {
		const root = barRef.current;
		if (!root) return;

		const children = Array.from(root.children).filter((el): el is HTMLElement => el instanceof HTMLElement);
		if (children.length === 0) {
			setClippedPayloads(prev => (prev.size === 0 ? prev : new Set()));
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				setClippedPayloads(prev => {
					const next = new Set(prev);
					for (const entry of entries) {
						const idx = children.indexOf(entry.target as HTMLElement);
						if (idx < 0) continue;
						const payload = sortedTabs[idx]?.payload;
						if (!payload) continue;
						if (entry.intersectionRatio < 0.92) next.add(payload);
						else next.delete(payload);
					}
					return next;
				});
			},
			{ root, threshold: [0, 0.92, 1] },
		);

		children.forEach(el => observer.observe(el));
		return () => observer.disconnect();
	}, [sortedTabs]);

	// Pull the selected tab into view whenever it changes — if it's currently
	// clipped behind the overflow boundary the user expects to see it.
	useEffect(() => {
		const root = barRef.current;
		if (!root || !selectedTab) return;

		const idx = sortedTabs.findIndex(t => t.payload === selectedTab.payload);
		if (idx < 0) return;

		const target = root.children[idx];
		if (target instanceof HTMLElement) {
			target.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
		}
	}, [selectedTab, sortedTabs]);

	const clippedTabs = React.useMemo(
		() => sortedTabs.filter(t => clippedPayloads.has(t.payload)),
		[sortedTabs, clippedPayloads],
	);

	useEffect(() => {
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [selectedTab]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab) return;

		// Ctrl+Tab cycling is handled by MruSwitcher (it intercepts the chord
		// in the capture phase). Keep the close-tab shortcuts here so they
		// continue to work regardless of the switcher's mount state.
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
			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
	}

	return (
		<TabPresentationContext.Provider value={tabPresentation}>
			<MruSwitcher />
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
									'[role=tab], [role=button], button, a, input, textarea, select, [data-no-drag]': {
										WebkitAppRegion: 'no-drag' as never,
									},
								}
							: undefined
					}
				>
					<TabBar
						ref={barRef}
						bg='transparent'
						px='1.5'
						flex='1'
						minW={0}
						css={{ '& > [role=tab]': { marginRight: '2px' } }}
					>
						{sortedTabs.map(t => (
							<TabSlot key={t.payload} tab={t} selectedPayload={selectedTab?.payload} />
						))}
					</TabBar>
					{clippedTabs.length > 0 && (
						<Flex flexShrink={0} align='center' h='100%' data-no-drag>
							<TabOverflowMenu clipped={clippedTabs} />
						</Flex>
					)}
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

interface TabSlotProps {
	tab: TabItem;
	selectedPayload?: string;
}

/**
 * Centralised liveness gate. Each concrete tab component focuses on
 * rendering live state; deletion-aware "dead tab" handling sits here so
 * we don't replicate the same `if (!node) return <DeadTab/>` plumbing in
 * every tab molecule.
 */
const TabSlot: React.FC<TabSlotProps> = ({ tab, selectedPayload }) => {
	const dead = useDeadTabKind(tab);
	if (dead) return <DeadTab tab={tab} kind={dead} active={selectedPayload === tab.payload} />;

	if (tab.type === 'request') return <RequestTab tab={tab} />;
	if (tab.type === 'variable_set_editor') return <VariableSetEditorTab tab={tab} />;
	if (tab.type === 'new_project_intro') return <NewProjectIntroTab tab={tab} />;
	if (tab.type === 'preferences') return <PreferencesTab tab={tab} />;
	if (tab.type === 'project_home') return <ProjectHomeTab tab={tab} />;
	if (tab.type === 'folder_overview') return <FolderOverviewTab tab={tab} />;
	if (tab.type === 'cookie_jar') return <CookieJarTab tab={tab} />;
	if (tab.type === 'workflow_editor') return <WorkflowEditorTab tab={tab} />;
	if (tab.type === 'variable_input_playground') return <VariableInputPlaygroundTab tab={tab} />;
	return null;
};

export default TabView;
