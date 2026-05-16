import type { FolderOverviewTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { Folder } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, closeTab, makeTabPermanent } from '../../store/actions';
import GenericTabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface FolderOverviewTabProps {
	tab: FolderOverviewTabItem;
}

const FolderOverviewTab: React.FC<FolderOverviewTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node || node.type !== 'folder') return null;

	return (
		<GenericTabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
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
						color='accent.indigo'
						bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 26%, transparent)'
						boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Folder size={11} strokeWidth={2.2} />
					</Box>
				)}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;
					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTab(tab.payload))}
			>
				{tab.temporary && <em>{node.name}</em>}
				{!tab.temporary && node.name}
			</TabItem>
		</GenericTabContextMenuWrapper>
	);
};

export default FolderOverviewTab;
