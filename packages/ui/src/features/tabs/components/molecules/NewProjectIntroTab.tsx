import { Box } from '@chakra-ui/react';
import type { NewProjectIntroTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Sparkles } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, changeTabNext, makeTabPermanent } from '../../store/actions';
import GenericTabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface NewProjectIntroTabProps {
	tab: NewProjectIntroTabItem;
}

/**
 * The Getting Started tab is special: closing it doesn't drop it from the
 * tab list, it just demotes it to an icon-only chip pinned at the leftmost
 * position (TabView handles the sort). Clicking the chip re-selects the
 * intro tab and the full label returns.
 */
const NewProjectIntroTab: React.FC<React.PropsWithChildren<NewProjectIntroTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const activeTabs = useAppSelector(s => s.features.tabs.activeTabs);
	const [target, setTarget] = useState<HTMLElement>();
	const active = selectedTabPayload === tab.payload;
	const hasOtherTabs = activeTabs.length > 1;
	// When inactive, the chip collapses to just the icon — gives the user
	// the "minimized" affordance they expect from closing the tab.
	const showLabel = active;

	return (
		<GenericTabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={active}
				variant='card'
				leading={(
					<Box
						as='span'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						w='18px'
						h='18px'
						borderRadius='sm'
						borderWidth='1px'
						borderStyle='solid'
						color='accent.pink'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
						boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Sparkles size={11} strokeWidth={2.2} />
					</Box>
				)}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				title={showLabel ? undefined : 'Getting started'}
				aria-label='Getting started'
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;

					dispatch(makeTabPermanent(tab.payload));
				}}
				// Only offer the close affordance when the user has somewhere to
				// fall back to — closing onto an empty workbench would just
				// re-select the intro anyway.
				onClose={
					active && hasOtherTabs
						? () => dispatch(changeTabNext())
						: undefined
				}
			>
				{showLabel && (tab.temporary ? <em>{'Getting started'}</em> : 'Getting started')}
			</TabItem>
		</GenericTabContextMenuWrapper>
	);
};

export default NewProjectIntroTab;
