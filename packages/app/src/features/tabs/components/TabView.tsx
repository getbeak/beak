import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TabItem } from '@beak/common/types/beak-project';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import TB from '../../../components/atoms/TabBar';
import { changeTabNext, changeTabPrevious, closeTab, closeTabsOther } from '../store/actions';
import RendererTab from './molecules/RendererTab';
import RequestTab from './molecules/RequestTab';
import Router from './Router';

interface TabViewProps {
	tabs: TabItem[];
	selectedTab: TabItem | undefined;
}

const TabView: React.FunctionComponent<TabViewProps> = ({ selectedTab, tabs }) => {
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
		<React.Fragment>
			<TabBar>
				{tabs.map(t => {
					if (t.type === 'request')
						return <RequestTab key={t.payload} tab={t} />;

					if (t.type === 'renderer')
						return <RendererTab key={t.payload} tab={t} />;

					return null;
				})}
			</TabBar>

			<ShortcutContainer>
				<Router selectedTab={selectedTab} />
			</ShortcutContainer>
		</React.Fragment>
	);
};

const ShortcutContainer = styled.div`
	height: calc(100% - 34px);
`;

const TabBar = styled(TB)`
	background-color: ${props => props.theme.ui.secondarySurface};
`;

export default TabView;
