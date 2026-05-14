import { Box } from '@chakra-ui/react';
import { sidebarPreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
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
	const persistTimerRef = useRef<number | null>(null);

	// Mirror external (Redux-driven) collapse changes — e.g. when the omni-bar
	// "Toggle sidebar" command flips the preference. Without this sync the
	// section's local animation state would diverge from the persisted value.
	useEffect(() => {
		setUiCollapsed(collapsed);
	}, [collapsed]);

	useEffect(() => () => {
		if (persistTimerRef.current !== null) window.clearTimeout(persistTimerRef.current);
	}, []);

	function setCollapsedProxy() {
		if (disableCollapse) return;

		const collapsing = !uiCollapsed;
		setUiCollapsed(collapsing);

		if (persistTimerRef.current !== null) {
			window.clearTimeout(persistTimerRef.current);
			persistTimerRef.current = null;
		}

		if (collapsing) {
			persistTimerRef.current = window.setTimeout(() => {
				persistTimerRef.current = null;
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
					transition='height .28s cubic-bezier(.4,0,.2,1), min-height .28s cubic-bezier(.4,0,.2,1), flex-grow .28s cubic-bezier(.4,0,.2,1), flex-shrink .28s cubic-bezier(.4,0,.2,1), opacity .18s ease'
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
