import { Box, Flex } from '@chakra-ui/react';
import type { TabItem } from '@beak/common/types/beak-project';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../components/atoms/TabBar';
import { changeTabNext, changeTabPrevious, closeTab, closeTabsAll, closeTabsOther } from '../store/actions';
import NewProjectIntroTab from './molecules/NewProjectIntroTab';
import RequestTab from './molecules/RequestTab';
import VariableSetEditorTab from './molecules/VariableSetEditorTab';
import Router from './Router';

interface TabViewProps {
	tabs: TabItem[];
	selectedTab: TabItem | undefined;
}

const TabView: React.FC<TabViewProps> = ({ selectedTab, tabs }) => {
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
			<TabBar
				bg='bg.canvas'
				borderBottomWidth='1px'
				borderBottomStyle='solid'
				borderBottomColor='border.subtle'
				px='1.5'
				flexShrink={0}
				css={{ '& > [role=tab]': { marginRight: '2px' } }}
			>
				{tabs.map(t => {
					if (t.type === 'request') return <RequestTab key={t.payload} tab={t} />;
					if (t.type === 'variable_set_editor') return <VariableSetEditorTab key={t.payload} tab={t} />;
					if (t.type === 'new_project_intro') return <NewProjectIntroTab key={t.payload} tab={t} />;
					return null;
				})}
			</TabBar>

			<Box flex='1' minH={0}>
				<Router selectedTab={selectedTab} />
			</Box>
		</Flex>
	);
};

export default TabView;
