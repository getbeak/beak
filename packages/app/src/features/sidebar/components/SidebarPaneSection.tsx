import React, { useState } from 'react';
import type { MenuItemConstructorOptions } from 'electron';

import SectionHeader from './molecules/SectionHeader';

interface SidebarPaneSectionProps {
	actions?: MenuItemConstructorOptions[];
	title: string;
	collapseKey: string;
}

const SidebarPaneSection: React.FunctionComponent<SidebarPaneSectionProps> = props => {
	const { actions, title, children } = props;
	const [expanded, setExpanded] = useState(true);

	return (
		<React.Fragment>
			<SectionHeader
				actions={actions}
				onClick={() => setExpanded(!expanded)}
			>
				{title}
			</SectionHeader>
			{expanded && children}
		</React.Fragment>
	);
};

export default SidebarPaneSection;
