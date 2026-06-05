import type { TabItem as TabItemType } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { FileX2, FolderX } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { closeTab } from '../../store/actions';

interface DeadTabProps {
	tab: TabItemType;
	kind: DeadKind;
	active?: boolean;
}

export type DeadKind = 'request' | 'folder' | 'workflow';

const LABELS: Record<DeadKind, string> = {
	request: 'Deleted request',
	folder: 'Deleted folder',
	workflow: 'Deleted workflow',
};

/**
 * Placeholder tab for an editor whose underlying file no longer exists.
 * Renders in-place instead of silently vanishing so the user can see the
 * stale tab and close it deliberately. The active payload doesn't matter
 * — clicking just makes this tab selected, and the Router will fall back
 * to its missing-payload state. Closing dispatches the standard `closeTab`.
 */
const DeadTab: React.FC<DeadTabProps> = ({ active, kind, tab }) => {
	const dispatch = useDispatch();
	const Icon = kind === 'folder' ? FolderX : FileX2;
	const label = LABELS[kind];

	return (
		<TabItem
			active={active}
			variant='card'
			title='Source file no longer exists. Save again to bring it back, or close this tab.'
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
					color='fg.subtle'
					bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 12%, transparent)'
					borderColor='color-mix(in srgb, var(--beak-colors-fg-subtle) 24%, transparent)'
				>
					<Icon size={11} strokeWidth={2.2} />
				</Box>
			}
			onClose={() => dispatch(closeTab(tab.payload))}
			style={{ opacity: 0.55, fontStyle: 'italic' }}
		>
			<Box as='span' css={{ textDecoration: 'line-through' }}>
				{label}
			</Box>
		</TabItem>
	);
};

/**
 * Resolve a tab's "liveness". Returns `null` when the tab has no
 * dead-tab concept (intro screens, preferences, etc — they're inherently
 * always alive), `kind` describing the missing entity otherwise.
 */
export function useDeadTabKind(tab: TabItemType): DeadKind | null {
	const node = useAppSelector(s =>
		tab.type === 'request' || tab.type === 'folder_overview' ? s.global.project.tree[tab.payload] : undefined,
	);
	const workflowExists = useAppSelector(s =>
		tab.type === 'workflow_editor' ? s.global.workflows.workflows[tab.payload] !== undefined : true,
	);

	if (tab.type === 'request') {
		if (!node || node.type !== 'request') return 'request';
		return null;
	}
	if (tab.type === 'folder_overview') {
		if (!node || node.type !== 'folder') return 'folder';
		return null;
	}
	if (tab.type === 'workflow_editor') {
		if (!workflowExists) return 'workflow';
		return null;
	}
	return null;
}

export default DeadTab;
