import type { RequestTabItem } from '@beak/common/types/beak-project';
import { verbToColor } from '@beak/design-system/helpers';
import AlertFlair from '@beak/ui/features/alerts/components/AlertFlair';
import { closeTabIntent } from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { ArrowUpRight, Link2, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import TabItem from '../../../../components/atoms/TabItem';
import { changeTab, makeTabPermanent } from '../../store/actions';
import TabContextMenuWrapper from '../atoms/RequestTabContextMenuWrapper';

interface RequestTabProps {
	tab: RequestTabItem;
}

const RequestTab: React.FC<React.PropsWithChildren<RequestTabProps>> = ({ tab }) => {
	const dispatch = useDispatch();
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	// Pull the parent folder name so introspection tabs can pin themselves to
	// the endpoint they belong to (otherwise every endpoint's seed shows the
	// same opaque "Introspection" / "Discover schema" label).
	const parentName = useAppSelector(s => {
		if (!node || node.type !== 'request' || !node.parent) return undefined;
		const parent = s.global.project.tree[node.parent];
		return parent?.type === 'folder' ? parent.name : undefined;
	});
	const [target, setTarget] = useState<HTMLElement>();

	if (!node || node.type !== 'request') return null;

	const verb = node.mode === 'valid' ? node.info.verb : 'get';
	const color = verbToColor(verb);
	const isIntrospection = node.mode === 'valid' && node.info.introspection === true;
	const isLinked = node.mode === 'valid' && node.info._provenance?.linked === true;
	const isDirty = useAppSelector(s => Boolean(s.global.project.linkedDirty[node.id]));
	const isStale = useAppSelector(s => Boolean(s.global.project.linkedStale[node.id]));
	const VerbIcon = isLinked ? Link2 : ArrowUpRight;
	const verbIconColor = isStale ? 'var(--beak-colors-accent-alert)' : color;
	const verbIconTitle = isLinked
		? `${verb.toUpperCase()} — ${isStale ? 'spec re-synced, disk diverges' : isDirty ? 'linked, unsaved edits' : 'linked to schema source'}`
		: verb.toUpperCase();

	return (
		<TabContextMenuWrapper tab={tab} target={target}>
			<TabItem
				active={selectedTabPayload === node.id}
				variant='card'
				leading={
					<Flex align='center' gap='1'>
						<Box
							as='span'
							display='inline-flex'
							alignItems='center'
							justifyContent='center'
							w='14px'
							h='14px'
							color={verbIconColor}
							title={verbIconTitle}
							aria-label={verbIconTitle}
						>
							<VerbIcon size={12} strokeWidth={2} />
						</Box>
						{isIntrospection && (
							<Flex
								as='span'
								align='center'
								justify='center'
								w='14px'
								h='14px'
								borderRadius='sm'
								color='accent.indigo'
								bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
								title='Endpoint introspection seed'
								aria-label='Endpoint introspection seed'
							>
								<Sparkles size={9} strokeWidth={2.2} />
							</Flex>
						)}
						{isDirty && (
							<Box
								as='span'
								w='6px'
								h='6px'
								borderRadius='full'
								bg='accent.alert'
								title='Unsaved edits'
								aria-label='Unsaved edits'
							/>
						)}
						<AlertFlair requestId={node.id} size={14} interactive />
					</Flex>
				}
				key={node.id}
				lazyForwardedRef={i => setTarget(i!)}
				onClick={() => dispatch(changeTab(tab))}
				onDoubleClick={() => {
					if (!tab.temporary) return;

					dispatch(makeTabPermanent(tab.payload));
				}}
				onClose={() => dispatch(closeTabIntent(tab.payload))}
			>
				{(() => {
					// Introspection seeds get the parent endpoint name appended so the
					// tab strip is scannable when multiple endpoints are open. Falls
					// back to the bare name when we can't find a parent (untyped tree
					// edge cases) instead of inventing a label.
					const label = isIntrospection && parentName ? `${node.name} · ${parentName}` : node.name;
					return tab.temporary ? <em>{label}</em> : label;
				})()}
			</TabItem>
		</TabContextMenuWrapper>
	);
};

export default RequestTab;
