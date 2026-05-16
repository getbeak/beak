import type { WorkflowEditorTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { Workflow } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
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
	const [target, setTarget] = useState<HTMLElement>();

	const label = name ?? 'Workflow';

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === tab.payload}
				variant='card'
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
				{tab.temporary ? <em>{label}</em> : label}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default WorkflowEditorTab;
