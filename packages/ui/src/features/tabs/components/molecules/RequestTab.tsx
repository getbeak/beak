import { Box } from '@chakra-ui/react';
import type { RequestTabItem } from '@beak/common/types/beak-project';
import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, closeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/RequestTabContextMenuWrapper';

interface RequestTabProps {
	tab: RequestTabItem;
}

const VERB_COLOR: Record<string, string> = {
	get: 'var(--beak-colors-accent-teal)',
	post: 'var(--beak-colors-accent-pink)',
	put: 'var(--beak-colors-accent-indigo)',
	patch: 'var(--beak-colors-accent-indigo)',
	delete: 'var(--beak-colors-accent-alert)',
	head: 'var(--beak-colors-fg-muted)',
	options: 'var(--beak-colors-fg-muted)',
};

const VERB_LABEL: Record<string, string> = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	patch: 'PATCH',
	delete: 'DEL',
	head: 'HEAD',
	options: 'OPTS',
};

const RequestTab: React.FC<React.PropsWithChildren<RequestTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const [target, setTarget] = useState<HTMLElement>();

	if (!node || node.type !== 'request') return null;

	const verb = node.mode === 'valid' ? node.info.verb : 'get';
	const color = VERB_COLOR[verb] ?? 'var(--beak-colors-fg-muted)';
	const label = VERB_LABEL[verb] ?? verb.toUpperCase();

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === node.id}
				variant='card'
				leading={(
					<Box
						as='span'
						fontSize='9px'
						fontWeight='700'
						letterSpacing='0.06em'
						textTransform='uppercase'
						px='1'
						py='0'
						borderRadius='xs'
						color={color}
						bg={`color-mix(in srgb, ${color} 12%, transparent)`}
						lineHeight='1.5'
					>
						{label}
					</Box>
				)}
				key={node.id}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;

					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTab(tab.payload))}
			>
				{tab.temporary && <em>{node.name}</em>}
				{!tab.temporary && node.name}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default RequestTab;
