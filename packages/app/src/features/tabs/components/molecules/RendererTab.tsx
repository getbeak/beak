import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RendererTabItem } from '@beak/common/types/beak-project';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/RendererTabContextMenuWrapper';

interface RendererTabProps {
	tab: RendererTabItem;
}

const RendererTab: React.FunctionComponent<RendererTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				key={tab.payload}
				ref={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(makeTabPermanent(tab.payload));
				}}
			>
				{tab.temporary && <em>{rendererToName(tab)}</em>}
				{!tab.temporary && rendererToName(tab)}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

function rendererToName(tab: RendererTabItem) {
	switch (tab.payload) {
		case 'variable_group_editor':
			return 'Variable Group Editor';

		default:
			return 'Unknown renderer';
	}
}

export default RendererTab;
