import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import useRealtimeValueContext from '@beak/ui/features/realtime-values/hooks/use-realtime-value-context';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import type { FolderNode, Nodes, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import Fuse from 'fuse.js';
import styled, { css } from 'styled-components';

import NoItemsFound from '../atoms/NoItemsFound';
import FinderRequestItem from '../molecule/FinderRequestItem';

export interface FinderViewProps {
	content: string;
	reset: () => void;
}

const FinderView: React.FC<React.PropsWithChildren<FinderViewProps>> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree) || ({} as Tree);
	const flattened = TypedObject.values(tree).filter(t => t.type === 'request') as ValidRequestNode[];
	const [matches, setMatches] = useState<string[]>([]);
	const [active, setActive] = useState<number>(-1);
	const context = useRealtimeValueContext();
	const activeRef = useRef<HTMLElement | null>(null);

	const fuse = new Fuse(flattened, {
		includeScore: true,
		keys: [
			'name',
			'info.uri.host',
			'info.uri.path',
		],
	});

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			switch (true) {
				case checkShortcut('omni-bar.finder.down', event):
					setActive(movePosition(matches, active, 'forward'));
					setTimeout(() => {
						// This actually exists
						// @ts-expect-error
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);

					break;

				case checkShortcut('omni-bar.finder.up', event):
					setActive(movePosition(matches, active, 'backward'));
					setTimeout(() => {
						// This actually exists
						// @ts-expect-error
						activeRef.current?.scrollIntoViewIfNeeded(false);
					}, 0);

					break;

				case checkShortcut('omni-bar.finder.open', event):
					if (active < 0)
						break;

					reset();
					dispatch(changeTab({
						type: 'request',
						payload: matches[active],
						temporary: true,
					}));

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

		if (active === -1 && matchedIds.length > 0)
			setActive(0);
	}, [content]);

	return (
		<Container tabIndex={0}>
			{matches.length === 0 && (
				<NoItemsFound>
					{'No matching requests found... sadface'}
				</NoItemsFound>
			)}
			{matches.map((k, idx) => {
				const match = tree[k];
				const reqNode = match as ValidRequestNode;
				const parentChain = [];
				let parentFinderNode: Nodes = reqNode;

				while (parentFinderNode.parent) {
					const parent = tree[parentFinderNode.parent] as FolderNode | undefined;

					if (!parent)
						break;

					parentChain.unshift(parent);
					parentFinderNode = parent;
				}

				return (
					<Item
						$active={active === idx}
						ref={i => {
							if (active === idx)
								activeRef.current = i;
						}}
						key={k}
						tabIndex={0}
						onClick={() => {
							reset();
							dispatch(changeTab({
								type: 'request',
								payload: k,
								temporary: true,
							}));
						}}
					>
						<React.Fragment>
							{parentChain.map(p => (
								<ParentChain key={p.id}>
									{p.name}
								</ParentChain>
							))}
						</React.Fragment>
						{match.name}
						{match.type === 'request' && (
							<React.Fragment>
								<FinderRequestItem
									context={{ ...context, currentRequestId: match.id }}
									info={reqNode.info}
								/>
							</React.Fragment>
						)}
					</Item>
				);
			})}
		</Container>
	);
};

const Container = styled.div`
	overflow: none;
`;

const Item = styled.div<{ $active: boolean }>`
	font-size: 13px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	padding: 4px 10px;
	cursor: pointer;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;

	&:hover { background: ${p => p.theme.ui.secondaryActionMuted}; }
	${p => p.$active ? css`background: ${p => p.theme.ui.secondaryActionMuted};` : ''}

	&:last-of-type {
		padding-bottom: 10px;
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
	}
`;

const ParentChain = styled.span`
	display: inline-block;
	font-size: 13px;
	color: ${p => p.theme.ui.textMinor};
	margin-bottom: 4px;

	&:not(:last-of-type):after {
		content: '/';
		margin: 0 2px;
	}

	&:last-of-type {
		margin-right: 4px;
	}
`;

export default FinderView;
