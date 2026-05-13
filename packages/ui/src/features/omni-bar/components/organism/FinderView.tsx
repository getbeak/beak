import { Box, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import type { FolderNode, Nodes, Tree, ValidRequestNode } from '@getbeak/types/nodes';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { ChevronRight, FileText } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import NoItemsFound from '../atoms/NoItemsFound';
import FinderRequestItem from '../molecule/FinderRequestItem';

export interface FinderViewProps {
	content: string;
	reset: () => void;
}

import { verbToColor } from '@beak/design-system/helpers';

const FinderView: React.FC<FinderViewProps> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree) || ({} as Tree);
	const flattened = useMemo(
		() => TypedObject.values(tree).filter(t => t.type === 'request') as ValidRequestNode[],
		[tree],
	);
	const [matches, setMatches] = useState<string[]>([]);
	const [active, setActive] = useState<number>(-1);
	const context = useVariableContext();
	const activeRef = useRef<HTMLElement | null>(null);

	const fuse = useMemo(
		() =>
			new Fuse(flattened, {
				includeScore: true,
				keys: ['name', 'info.uri.host', 'info.uri.path'],
			}),
		[flattened],
	);

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

	if (matches.length === 0) return <NoItemsFound>{'No matching requests'}</NoItemsFound>;

	return (
		<Box py='1'>
			{matches.map((k, idx) => {
				const match = tree[k];
				const reqNode = match as ValidRequestNode;
				const parentChain: FolderNode[] = [];
				let parentFinderNode: Nodes = reqNode;

				while (parentFinderNode.parent) {
					const parent = tree[parentFinderNode.parent] as FolderNode | undefined;
					if (!parent) break;
					parentChain.unshift(parent);
					parentFinderNode = parent;
				}

				const isActive = active === idx;
				const verb = (reqNode.info?.verb ?? 'GET').toUpperCase();
				const verbColor = verbToColor(verb);

				return (
					<Box
						key={k}
						ref={(i: HTMLElement | null) => {
							if (isActive) activeRef.current = i;
						}}
						tabIndex={0}
						mx='1.5'
						my='0.5'
						px='2.5'
						py='2'
						borderRadius='md'
						cursor='pointer'
						color={isActive ? 'white' : 'fg.muted'}
						bg={isActive ? 'accent.pink' : 'transparent'}
						boxShadow={
							isActive
								? '0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent), 0 6px 14px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)'
								: undefined
						}
						transition='background-color .14s ease, color .14s ease, box-shadow .14s ease'
						_hover={{
							color: 'fg.default',
							bg: isActive
								? 'accent.pink'
								: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
						}}
						onClick={() => {
							reset();
							dispatch(changeTab({ type: 'request', payload: k, temporary: true }));
						}}
					>
						<Flex align='center' gap='2' minW={0}>
							<Box flex='0 0 auto' color={isActive ? 'white' : 'fg.subtle'}>
								<FileText size={13} />
							</Box>
							<Box
								flex='0 0 auto'
								px='1.5'
								py='0.5'
								fontSize='9px'
								fontWeight='700'
								letterSpacing='0.05em'
								borderRadius='sm'
								style={
									isActive
										? {
											background: 'rgba(255,255,255,0.22)',
											color: 'white',
										}
										: {
											background: `color-mix(in srgb, ${verbColor} 22%, transparent)`,
											color: verbColor,
										}
								}
							>
								{verb}
							</Box>
							<Box minW={0} flex='1 1 auto' overflow='hidden'>
								<Flex align='center' gap='1' fontSize='sm' whiteSpace='nowrap'>
									{parentChain.length > 0 && (
										<Flex
											as='span'
											align='center'
											gap='0.5'
											color='fg.subtle'
											fontSize='xs'
											overflow='hidden'
											textOverflow='ellipsis'
										>
											{parentChain.map((p, i) => (
												<React.Fragment key={p.id}>
													{i > 0 && <ChevronRight size={9} />}
													<Box as='span'>{p.name}</Box>
												</React.Fragment>
											))}
											<ChevronRight size={9} />
										</Flex>
									)}
									<Box as='span' overflow='hidden' textOverflow='ellipsis'>
										{match.name}
									</Box>
								</Flex>
								{match.type === 'request' && (
									<Box mt='0.5'>
										<FinderRequestItem
											context={{ ...context, currentRequestId: match.id }}
											info={reqNode.info}
										/>
									</Box>
								)}
							</Box>
						</Flex>
					</Box>
				);
			})}
		</Box>
	);
};

export default FinderView;
