import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@beak/ui/store/redux';
import { NewProjectIntroTabItem } from '@beak/common/types/beak-project';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import GenericTabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface NewProjectIntroTabProps {
	tab: NewProjectIntroTabItem;
}

const NewProjectIntroTab: React.FC<React.PropsWithChildren<NewProjectIntroTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	return (
		<GenericTabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary)
						return;

					dispatch(makeTabPermanent(tab.payload));
				}}
			>
				{tab.temporary && <em>{'Getting started'}</em>}
				{!tab.temporary && 'Getting started'}
			</TabItem>
		</GenericTabContextMenuWrapper>
	);
};

export default NewProjectIntroTab;
