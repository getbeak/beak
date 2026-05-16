import type { TabItem } from '@beak/common/types/beak-project';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../components/atoms/TabBar';
import ErrorBoundary from '../../../components/molecules/ErrorBoundary';
import { changeTabNext, changeTabPrevious, closeTab, closeTabsAll, closeTabsOther } from '../store/actions';
import NewProjectIntroTab from './molecules/NewProjectIntroTab';
import PreferencesTab from './molecules/PreferencesTab';
import RequestTab from './molecules/RequestTab';
import VariableSetEditorTab from './molecules/VariableSetEditorTab';
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
		default:
			return 'Tab';
	}
}

const TabView: React.FC<TabViewProps> = ({ selectedTab, tabs, rightSlot }) => {
	const dispatch = useDispatch();

	useEffect(() => {
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [selectedTab]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab) return;

		switch (true) {
			case checkShortcut('tab-bar.current.close', event):
				dispatch(closeTab());
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
		<Flex direction='column' h='100%' bg='bg.surface'>
			<Flex
				direction='row'
				align='flex-end'
				bg='bg.canvas'
				borderBottomWidth='1px'
				borderBottomStyle='solid'
				borderBottomColor='border.subtle'
				flexShrink={0}
			>
				<TabBar bg='transparent' px='1.5' flex='1' minW={0} css={{ '& > [role=tab]': { marginRight: '2px' } }}>
					{tabs.map(t => {
						if (t.type === 'request') return <RequestTab key={t.payload} tab={t} />;
						if (t.type === 'variable_set_editor') return <VariableSetEditorTab key={t.payload} tab={t} />;
						if (t.type === 'new_project_intro') return <NewProjectIntroTab key={t.payload} tab={t} />;
						if (t.type === 'preferences') return <PreferencesTab key={t.payload} tab={t} />;
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
	);
};

export default TabView;
