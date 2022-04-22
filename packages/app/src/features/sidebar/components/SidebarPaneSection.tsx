import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sidebarPreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import type { MenuItemConstructorOptions } from 'electron';
import styled, { css } from 'styled-components';

import { SectionBodyContext, SectionBodyOptions } from '../context/section-body-context';
import SectionHeader from './molecules/SectionHeader';

interface SidebarPaneSectionProps {
	actions?: MenuItemConstructorOptions[];
	title: string;
	collapseKey: string;
	disableCollapse?: boolean;
}

const SidebarPaneSection: React.FunctionComponent<React.PropsWithChildren<SidebarPaneSectionProps>> = props => {
	const dispatch = useDispatch();
	const { actions, title, collapseKey, disableCollapse, children } = props;
	const [bodyOptions, setBodyOptions] = useState<SectionBodyOptions>({});

	const collapsed = useSelector(s => s.global.preferences.sidebar.collapsed[collapseKey]);
	const [uiCollapsed, setUiCollapsed] = useState(collapsed);

	function setCollapsedProxy() {
		if (disableCollapse)
			return;

		const collapsing = !collapsed;

		setUiCollapsed(collapsing);

		if (collapsing) {
			window.setTimeout(() => {
				dispatch(sidebarPreferenceSetCollapse({
					key: collapseKey,
					collapsed: collapsing,
				}));
			}, 200);
		} else {
			dispatch(sidebarPreferenceSetCollapse({
				key: collapseKey,
				collapsed: collapsing,
			}));
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
				<SectionBody
					$minHeight={bodyOptions.minHeight}
					$maxHeight={bodyOptions.maxHeight}
					$flexGrow={bodyOptions.flexGrow}
					$flexShrink={bodyOptions.flexShrink}
					$collapsed={uiCollapsed}
				>
					{!collapsed && children}
				</SectionBody>
			</SectionBodyContext.Provider>
		</React.Fragment>
	);
};

interface SectionBodyProps {
	$minHeight: string | undefined;
	$maxHeight: string | undefined;
	$flexGrow: number | undefined;
	$flexShrink: number | undefined;
	$collapsed: boolean;
}

const SectionBody = styled.div<SectionBodyProps>`
	transition:
		height .3s ease,
		min-height .3s ease,
		flex-grow .3s ease,
		flex-shrink .3s ease,
		opacity .2s ease;

	${p => p.$flexGrow !== void 0 && css`
		flex-grow: ${p.$flexGrow};
		overflow-y: overlay;
	`}
	${p => p.$flexShrink !== void 0 && css`
		flex-shrink: ${p.$flexShrink};
		overflow-y: scroll;
	`}

	${p => p.$maxHeight !== void 0 && css`max-height: ${p.$maxHeight};`}
	${p => p.$minHeight !== void 0 && css`min-height: ${p.$minHeight};`}

	${p => p.$collapsed && css`
		opacity: 0;
		height: 0;
		min-height: 0;
		flex-grow: 0.00001;
		flex-shrink: 0.00001;
	`}
`;

export default SidebarPaneSection;
