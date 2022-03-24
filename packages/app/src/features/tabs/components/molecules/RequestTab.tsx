import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RequestTabItem } from '@beak/common/types/beak-project';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/RequestTabContextMenuWrapper';

interface RequestTabProps {
	tab: RequestTabItem;
}

const RequestTab: React.FunctionComponent<RequestTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const node = useSelector(s => s.global.project.tree[tab.payload]);
	const selectedTabPayload = useSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node)
		return null;

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === node.id}
				key={node.id}
				ref={i => setTarget(i!)}
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
