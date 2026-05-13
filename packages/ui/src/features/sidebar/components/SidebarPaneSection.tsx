import { Box } from '@chakra-ui/react';
import { sidebarPreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { SectionBodyContext, type SectionBodyOptions } from '../context/section-body-context';
import SectionHeader from './molecules/SectionHeader';

interface SidebarPaneSectionProps {
	actions?: MenuItemConstructorOptions[];
	title: string;
	collapseKey: string;
	disableCollapse?: boolean;
}

const SidebarPaneSection: React.FC<React.PropsWithChildren<SidebarPaneSectionProps>> = props => {
	const dispatch = useDispatch();
	const { actions, title, collapseKey, disableCollapse, children } = props;
	const [bodyOptions, setBodyOptions] = useState<SectionBodyOptions>({});

	const collapsed = useAppSelector(s => s.global.preferences.sidebar.collapsed[collapseKey]);
	const [uiCollapsed, setUiCollapsed] = useState(collapsed);

	function setCollapsedProxy() {
		if (disableCollapse) return;

		const collapsing = !collapsed;
		setUiCollapsed(collapsing);

		if (collapsing) {
			window.setTimeout(() => {
				dispatch(sidebarPreferenceSetCollapse({ key: collapseKey, collapsed: collapsing }));
			}, 200);
		} else {
			dispatch(sidebarPreferenceSetCollapse({ key: collapseKey, collapsed: collapsing }));
		}
	}

	return (
		<React.Fragment>
			<SectionHeader
				actions={actions}
				collapsed={uiCollapsed}
				disableCollapse={disableCollapse}
				onClick={setCollapsedProxy}
			>
				{title}
			</SectionHeader>
			<SectionBodyContext.Provider value={setBodyOptions}>
				<Box
					transition='height .3s ease, min-height .3s ease, flex-grow .3s ease, flex-shrink .3s ease, opacity .2s ease'
					flexGrow={uiCollapsed ? 0.00001 : bodyOptions.flexGrow}
					flexShrink={uiCollapsed ? 0.00001 : bodyOptions.flexShrink}
					maxH={uiCollapsed ? '0' : bodyOptions.maxHeight}
					minH={uiCollapsed ? '0' : bodyOptions.minHeight}
					opacity={uiCollapsed ? 0 : 1}
					height={uiCollapsed ? '0' : undefined}
					overflowY={
						bodyOptions.flexGrow !== void 0
							? 'auto'
							: bodyOptions.flexShrink !== void 0
								? 'scroll'
								: undefined
					}
				>
					{!collapsed && children}
				</Box>
			</SectionBodyContext.Provider>
		</React.Fragment>
	);
};

export default SidebarPaneSection;
