import { Box } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import type { FolderNode, Nodes, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import Fuse from 'fuse.js';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import NoItemsFound from '../atoms/NoItemsFound';
import FinderRequestItem from '../molecule/FinderRequestItem';

export interface FinderViewProps {
	content: string;
	reset: () => void;
}

const FinderView: React.FC<FinderViewProps> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree) || ({} as Tree);
	const flattened = TypedObject.values(tree).filter(t => t.type === 'request') as ValidRequestNode[];
	const [matches, setMatches] = useState<string[]>([]);
	const [active, setActive] = useState<number>(-1);
	const context = useVariableContext();
	const activeRef = useRef<HTMLElement | null>(null);

	const fuse = new Fuse(flattened, {
		includeScore: true,
		keys: ['name', 'info.uri.host', 'info.uri.path'],
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('omni-bar.finder.down', event):
					setActive(movePosition(matches, active, 'forward'));
					setTimeout(() => {
						// @ts-expect-error scrollIntoViewIfNeeded exists in Chromium
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);
					break;
				case checkShortcut('omni-bar.finder.up', event):
					setActive(movePosition(matches, active, 'backward'));
					setTimeout(() => {
						// @ts-expect-error see above
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);
					break;
				case checkShortcut('omni-bar.finder.open', event):
					if (active < 0) break;
					reset();
					dispatch(changeTab({ type: 'request', payload: matches[active], temporary: true }));
					break;
				default:
					return;
			}
			event.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [matches, active, reset]);

	useEffect(() => {
		const matchedIds = fuse.search(content).map(s => s.item.id);
		setMatches(matchedIds);
		if (active === -1 && matchedIds.length > 0) setActive(0);
	}, [content]);

	return (
		<Box tabIndex={0}>
			{matches.length === 0 && <NoItemsFound>{'No matching requests found'}</NoItemsFound>}
			{matches.map((k, idx) => {
				const match = tree[k];
				const reqNode = match as ValidRequestNode;
				const parentChain = [];
				let parentFinderNode: Nodes = reqNode;

				while (parentFinderNode.parent) {
					const parent = tree[parentFinderNode.parent] as FolderNode | undefined;
					if (!parent) break;
					parentChain.unshift(parent);
					parentFinderNode = parent;
				}

				return (
					<Box
						key={k}
						ref={(i: HTMLElement | null) => {
							if (active === idx) activeRef.current = i;
						}}
						tabIndex={0}
						fontSize='md'
						color='fg.default'
						px='2.5'
						py='1'
						cursor='pointer'
						whiteSpace='nowrap'
						overflow='hidden'
						textOverflow='ellipsis'
						textDecoration='none'
						bg={active === idx ? 'accent.pink.muted' : undefined}
						_hover={{ bg: 'accent.pink.muted' }}
						_last={{ pb: '2.5', borderBottomLeftRadius: 'lg', borderBottomRightRadius: 'lg' }}
						onClick={() => {
							reset();
							dispatch(changeTab({ type: 'request', payload: k, temporary: true }));
						}}
					>
						{parentChain.map(p => (
							<Box
								as='span'
								key={p.id}
								display='inline-block'
								fontSize='md'
								color='fg.muted'
								mb='1'
								_notLast={{ _after: { content: "'/'", margin: '0 2px' } }}
								_last={{ mr: '1' }}
							>
								{p.name}
							</Box>
						))}
						{match.name}
						{match.type === 'request' && (
							<FinderRequestItem
								context={{ ...context, currentRequestId: match.id }}
								info={reqNode.info}
							/>
						)}
					</Box>
				);
			})}
		</Box>
	);
};

export default FinderView;
