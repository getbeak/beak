import type { WorkflowEditorTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { Workflow } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, closeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/GenericTabContextMenuWrapper';

interface WorkflowEditorTabProps {
	tab: WorkflowEditorTabItem;
}

const WorkflowEditorTab: React.FC<React.PropsWithChildren<WorkflowEditorTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const name = useAppSelector(s => s.global.workflows.workflows[tab.payload]?.name);
	const pendingWrite = useAppSelector(s => Boolean(s.global.workflows.writeDebouncer));
	const [target, setTarget] = useState<HTMLElement>();

	const isActive = selectedTabPayload === tab.payload;
	const base = name ?? 'Workflow';
	// Bullet shows only on the active tab — writeDebouncer is global so we
	// can't pinpoint which workflow is dirty, but only the active tab can
	// have caused the pending write (editor dispatches come from its mount).
	const label = pendingWrite && isActive ? `• ${base}` : base;

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				variant='card'
				preview={tab.temporary}
				leading={
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
						<Workflow size={11} strokeWidth={2.2} />
					</Box>
				}
				key={tab.payload}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;
					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTab(tab.payload))}
			>
				{label}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default WorkflowEditorTab;
