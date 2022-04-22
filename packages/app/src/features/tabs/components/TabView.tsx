import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TabItem } from '@beak/common/types/beak-project';
import styled from 'styled-components';

import TB from '../../../components/atoms/TabBar';
import { changeTabNext, changeTabPrevious, closeTab, closeTabsOther } from '../store/actions';
import RequestTab from './molecules/RequestTab';
import VariableGroupEditorTab from './molecules/VariableGroupEditorTab';
import Router from './Router';

interface TabViewProps {
	tabs: TabItem[];
	selectedTab: TabItem | undefined;
}

const TabView: React.FunctionComponent<React.PropsWithChildren<TabViewProps>> = ({ selectedTab, tabs }) => {
	const dispatch = useDispatch();

	useEffect(() => {
		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [selectedTab]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab)
			return;

		switch (true) {
			case checkShortcut('tab-bar.all.close', event):
				dispatch(closeTab());

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
		<Container>
			<TabBar>
				{tabs.map(t => {
					if (t.type === 'request')
						return <RequestTab key={t.payload} tab={t} />;

					if (t.type === 'variable_group_editor')
						return <VariableGroupEditorTab key={t.payload} tab={t} />;

					return null;
				})}
			</TabBar>

			<ShortcutContainer>
				<Router selectedTab={selectedTab} />
			</ShortcutContainer>
		</Container>
	);
};

const Container = styled.div`
	height: 100%;
	background-color: ${props => props.theme.ui.secondarySurface};
`;

const ShortcutContainer = styled.div`
	height: calc(100% - 72px);
`;

const TabBar = styled(TB)`
	background-color: ${props => props.theme.ui.secondarySurface};
`;

export default TabView;
