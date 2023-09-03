import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RequestTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/RequestTabContextMenuWrapper';

interface RequestTabProps {
	tab: RequestTabItem;
}

const RequestTab: React.FC<React.PropsWithChildren<RequestTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node)
		return null;

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === node.id}
				key={node.id}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(makeTabPermanent(tab.payload));
				}}
			>
				{tab.temporary && <em>{node.name}</em>}
				{!tab.temporary && node.name}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default RequestTab;
