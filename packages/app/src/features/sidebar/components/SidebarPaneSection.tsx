import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sidebarPreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import type { MenuItemConstructorOptions } from 'electron';

import SectionHeader from './molecules/SectionHeader';

interface SidebarPaneSectionProps {
	actions?: MenuItemConstructorOptions[];
	title: string;
	collapseKey: string;
}

const SidebarPaneSection: React.FunctionComponent<SidebarPaneSectionProps> = props => {
	const { actions, title, collapseKey, children } = props;
	const collapsed = useSelector(s => s.global.preferences.sidebar.collapsed[collapseKey]);
	const dispatch = useDispatch();

	return (
		<React.Fragment>
			<SectionHeader
				actions={actions}
				onClick={() => dispatch(sidebarPreferenceSetCollapse({
					key: collapseKey,
					collapsed: !collapsed,
				}))}
			>
				{title}
			</SectionHeader>
			{!collapsed && children}
		</React.Fragment>
	);
};

export default SidebarPaneSection;
