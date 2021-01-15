import { actions } from '@beak/app/store/project';
import { RendererTabItem } from '@beak/app/store/project/types';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TabContextMenuWrapper from '../atoms/TabContextMenuWrapper';
import TabItem from '../atoms/TabItem';

interface RendererTabProps {
	tab: RendererTabItem;
}

const RendererTab: React.FunctionComponent<RendererTabProps> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useSelector(s => s.global.project.selectedTabPayload);
	const [target, setTarget] = useState<HTMLElement>();

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				key={tab.payload}
				ref={(i: HTMLDivElement) => setTarget(i)}
				onClick={() => dispatch(actions.tabSelected(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(actions.setTabAsPermanent(tab.payload));
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
