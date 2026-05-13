import { Variable } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { VariableSetEditorTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, closeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface VariableSetEditorTabProps {
	tab: VariableSetEditorTabItem;
}

const VariableSetEditorTab: React.FC<React.PropsWithChildren<VariableSetEditorTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				variant='card'
				leading={<Variable size={11} color='var(--beak-colors-accent-indigo)' />}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTab(tab.payload))}
			>
				{tab.temporary && <em>{rendererToName(tab)}</em>}
				{!tab.temporary && rendererToName(tab)}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

function rendererToName(tab: VariableSetEditorTabItem) {
	return `Variable set (${tab.payload})`;
}

export default VariableSetEditorTab;
