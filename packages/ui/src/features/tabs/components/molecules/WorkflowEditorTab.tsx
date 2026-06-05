import type { WorkflowEditorTabItem } from '@beak/common/types/beak-project';
import { inspectGraph, summariseHealth, validateWorkflow } from '@beak/state/workflows';
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
	const workflow = useAppSelector(s => s.global.workflows.workflows[tab.payload]);
	const name = workflow?.name;
	const stepCount = workflow?.nodes.length ?? 0;
	const { issueCount, issueTooltip } = React.useMemo(() => {
		if (!workflow) return { issueCount: 0, issueTooltip: '' };
		const health = inspectGraph(workflow);
		const warnings = validateWorkflow(workflow);
		const total =
			health.unreachable.length +
			health.unlinkedRequestNodes.length +
			health.cycleNodes.length +
			warnings.size;
		return { issueCount: total, issueTooltip: summariseHealth(health, warnings.size) ?? '' };
	}, [workflow]);
	const pendingWrite = useAppSelector(s => Boolean(s.global.workflows.writeDebouncer));
	const [target, setTarget] = useState<HTMLElement>();

	const isActive = selectedTabPayload === tab.payload;
	const base = name ?? 'Workflow';
	// Bullet shows only on the active tab — writeDebouncer is global so we
	// can't pinpoint which workflow is dirty, but only the active tab can
	// have caused the pending write (editor dispatches come from its mount).
	const labelPrefix = pendingWrite && isActive ? '• ' : '';
	// Hide the count for empty / single-Start workflows — it's noisy and not
	// informative; only show once the user has actually built something.
	const showCount = stepCount > 1;

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
				<Box as='span' display='inline-flex' alignItems='center' gap='1.5' minW={0}>
					<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
						{`${labelPrefix}${base}`}
					</Box>
					{showCount && issueCount === 0 && (
						<Box
							as='span'
							flexShrink={0}
							fontSize='10px'
							color='fg.subtle'
							fontVariantNumeric='tabular-nums'
							opacity={0.8}
						>
							{stepCount}
						</Box>
					)}
					{issueCount > 0 && (
						<Box
							as='span'
							flexShrink={0}
							fontSize='9px'
							fontWeight='700'
							color='accent.warning'
							fontVariantNumeric='tabular-nums'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 40%, transparent)'
							bg='color-mix(in srgb, var(--beak-colors-accent-warning) 14%, transparent)'
							borderRadius='sm'
							px='1'
							lineHeight='1.4'
							title={issueTooltip || `${issueCount} issue${issueCount === 1 ? '' : 's'} on this workflow`}
						>
							{`!${issueCount}`}
						</Box>
					)}
				</Box>
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default WorkflowEditorTab;
