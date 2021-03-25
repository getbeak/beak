import { actions } from '@beak/app/store/project';
import { RequestTabItem } from '@beak/app/store/project/types';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import TabContextMenuWrapper from '../atoms/RequestTabContextMenuWrapper';

interface RequestTabProps {
	tab: RequestTabItem;
}

const RequestTab: React.FunctionComponent<RequestTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const node = useSelector(s => s.global.project.tree[tab.payload]);
	const selectedTabPayload = useSelector(s => s.global.project.selectedTabPayload);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node)
		return null;

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === node.id}
				key={node.id}
				ref={(i: HTMLDivElement) => setTarget(i)}
				onClick={() => dispatch(actions.tabSelected(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(actions.setTabAsPermanent(tab.payload));
				}}
			>
				{tab.temporary && <em>{node.name}</em>}
				{!tab.temporary && node.name}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default RequestTab;
