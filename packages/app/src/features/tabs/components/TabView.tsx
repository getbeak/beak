import ReflexSplitter from '@beak/app/components/atoms/ReflexSplitter';
import RendererTab from '@beak/app/components/molecules/RendererTab';
import RequestTab from '@beak/app/components/molecules/RequestTab';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { actions } from '@beak/app/store/project';
import { TabItem } from '@beak/app/store/project/types';
import { movePosition } from '@beak/app/utils/arrays';
import React from 'react';
import { useDispatch } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import TB from '../../../components/atoms/TabBar';
import RequestPane from '../../request-pane/components/RequestPane';
import ResponsePane from '../../response-pane/components/ResponsePane';
import VariableGroupEditor from '../../variable-groups/components/VariableGroupEditor';

interface TabViewProps {
	tabs: TabItem[];
	selectedTab: TabItem | undefined;
}

const TabView: React.FunctionComponent<TabViewProps> = ({ selectedTab, tabs }) => {
	const dispatch = useDispatch();

	function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (!selectedTab)
			return;

		switch (true) {
			case checkShortcut('tab-bar.all.close', event):
				dispatch(actions.closeSelectedTab(selectedTab.payload));
				break;

			// case checkShortcut('tab-bar.all.close-others', event):
			// 	dispatch(actions.closeOtherSelectedTabs(selectedTab.payload));
			// 	break;

			case checkShortcut('tab-bar.all.previous', event):
			case checkShortcut('tab-bar.all.next', event): {
				const activeIndex = tabs.findIndex(i => i.payload === selectedTab.payload);
				let newIndex = activeIndex;

				if (event.key === 'ArrowLeft')
					newIndex = movePosition(tabs, activeIndex, 'backward');
				else if (event.key === 'ArrowRight')
					newIndex = movePosition(tabs, activeIndex, 'forward');

				dispatch(actions.tabSelected(tabs[newIndex]));
				break;
			}

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

			<ShortcutContainer onKeyDown={onKeyDown}>
				<SelectedTabContainer orientation={'vertical'}>
					{selectedTab?.type === 'request' && (
						<React.Fragment>
							<ReflexElement
								flex={50}
								minSize={450}
							>
								<RequestPane />
							</ReflexElement>

							<ReflexSplitter orientation={'vertical'} />

							<ReflexElement
								flex={50}
								minSize={450}
							>
								<ResponsePane />
							</ReflexElement>
						</React.Fragment>
					)}
					{selectedTab?.type === 'renderer' && <VariableGroupEditor />}
				</SelectedTabContainer>
			</ShortcutContainer>
		</React.Fragment>
	);
};

const ShortcutContainer = styled.div`
	height: calc(100% - 34px);
`;

const SelectedTabContainer = styled(ReflexContainer)`
	
`;

const TabBar = styled(TB)`
	background-color: ${props => props.theme.ui.secondarySurface};
`;

export default TabView;
