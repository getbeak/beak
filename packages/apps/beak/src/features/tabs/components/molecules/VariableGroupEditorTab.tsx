import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@beak/app-beak/store/redux';
import { VariableGroupEditorTabItem } from '@beak/shared-common/types/beak-project';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface VariableGroupEditorTabProps {
	tab: VariableGroupEditorTabItem;
}

const VariableGroupEditorTab: React.FC<React.PropsWithChildren<VariableGroupEditorTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
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

function rendererToName(tab: VariableGroupEditorTabItem) {
	return `Variable group (${tab.payload})`;
}

export default VariableGroupEditorTab;
