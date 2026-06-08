import { TypedObject } from '@beak/common/helpers/typescript';
import Kbd from '@beak/ui/components/atoms/Kbd';
import { VariableManager } from '@beak/ui/features/variables';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcExplorerService, ipcExtensionsService } from '@beak/ui/lib/ipc';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { Variable, VariableStaticInformation } from '@getbeak/extension-sdk';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Lock, Plug, SearchX } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { createFauxValue } from '../../../variables/values/variable-set-item';
import type { NormalizedSelection } from '../../utils/browser-selection';

interface Position {
	top: number;
	left: number;
}

export interface VariableSelectorProps {
	requestId?: string;
	editableElement: HTMLDivElement;
	sel: NormalizedSelection;
	query: string;
	/**
	 * Optional override for the popover anchor. When set, the legacy
	 * `editableElement.childNodes[sel.partIndex]` lookup is bypassed and the
	 * given rect is used directly. The Lexical-backed VariableInputV2 path
	 * uses this; the legacy contenteditable path leaves it undefined.
	 */
	anchorRect?: { top: number; left: number; width: number; height: number };
	onClose: () => void;
	onDone: (value: any) => void;
}

const VariableSelector: React.FC<React.PropsWithChildren<VariableSelectorProps>> = props => {
	const { editableElement, sel, query, requestId, anchorRect, onClose, onDone } = props;
	const { variableSets } = useAppSelector(s => s.global.variableSets);

	const activeRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState<Position | null>(null);
	const [active, setActive] = useState<number>(0);
	const context = useVariableContext(requestId);

	const items: VariableStaticInformation[] = useMemo(() => {
		const all: VariableStaticInformation[] = [
			...VariableManager.getVariables(requestId),

			// Variable sets act a little differently
			...TypedObject.keys(variableSets).flatMap(vgKey => {
				const vg = variableSets[vgKey];

				return TypedObject.keys(vg.items).map(i => createFauxValue({ itemId: i }, variableSets));
			}),
		];

		if (!query) return all;

		const fuse = new Fuse(all, {
			includeScore: true,
			keys: ['name', 'description', 'keywords'],
		});

		return fuse.search(query).map(r => r.item);
	}, [variableSets, query]);

	useEffect(() => {
		const cardWidth = 360;
		const margin = 12;

		if (anchorRect) {
			const rawLeft = anchorRect.left - 18;
			const left = Math.min(Math.max(margin, rawLeft), window.innerWidth - cardWidth - margin);
			setPosition({ left, top: anchorRect.top + anchorRect.height + 6 });
			return;
		}

		if (!sel) return;
		const node = editableElement.childNodes[sel.partIndex];
		if (!node) return;
		const range = new Range();
		range.selectNode(node);
		const rect = range.getBoundingClientRect();
		const contentLength = (node.textContent ?? '').length;
		const positionOffset = sel.offset / Math.max(contentLength, 1);
		const width = rect.width;
		const offsetDelta = width * positionOffset;
		// Clamp the popup so the right edge stays a few pixels inside the
		// viewport — without this the dialog can hang off-screen for URLs
		// that approach the right side of a project window.
		const rawLeft = rect.left + offsetDelta - 18;
		const left = Math.min(Math.max(margin, rawLeft), window.innerWidth - cardWidth - margin);
		setPosition({ left, top: rect.top + rect.height + 6 });
		// Depend on the concrete selection (partIndex / offset / isTextNode) so the
		// popover re-anchors as the user types the `{query}` and the caret moves.
		// `Boolean(sel)` would only fire once on first open and then never again.
	}, [
		sel?.partIndex,
		sel?.offset,
		sel?.isTextNode,
		editableElement,
		anchorRect?.top,
		anchorRect?.left,
		anchorRect?.width,
		anchorRect?.height,
	]);

	useEffect(() => {
		// @ts-expect-error scrollIntoViewIfNeeded exists in Chromium
		activeRef.current?.scrollIntoViewIfNeeded(false);
	}, [activeRef, active]);

	// When the query changes, snap the highlight back to the first result so
	// Enter inserts what the user is actually looking at.
	useEffect(() => {
		setActive(0);
	}, [query]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) return;
			if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) return;

			switch (event.key) {
				case 'ArrowUp':
				case 'ArrowDown': {
					const newIndex =
						event.key === 'ArrowUp' ? movePosition(items, active, 'backward') : movePosition(items, active, 'forward');
					setActive(newIndex);
					break;
				}

				case 'Enter': {
					const item = items[active];
					if (!item) return;
					createDefaultVariable(item);
					break;
				}

				case 'Escape':
					onClose();
					break;

				default:
					return;
			}

			event.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [active, items]);

	async function createDefaultVariable(item: VariableStaticInformation) {
		let payload: any;
		if (item.external) {
			payload = await ipcExtensionsService.variableCreateDefaultPayload({ type: item.type, context });
		} else {
			payload = await (item as Variable<any>).createDefaultPayload(context);
		}
		onDone({ type: item.type, payload });
	}

	/**
	 * Render the matched substring of the query inside a name with a pink
	 * highlight chip. Bare-bones case-insensitive prefix/substring match —
	 * matches what the user expects from typeahead, and gracefully falls
	 * back to plain text if there is no overlap.
	 */
	function renderHighlightedName(name: string) {
		if (!query) return name;
		const lower = name.toLowerCase();
		const q = query.toLowerCase();
		const start = lower.indexOf(q);
		if (start < 0) return name;
		const end = start + q.length;
		return (
			<React.Fragment>
				{name.slice(0, start)}
				<Box
					as='mark'
					px='0.5'
					mx='-0.5'
					borderRadius='2px'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)'
					color='fg.default'
					fontWeight='600'
				>
					{name.slice(start, end)}
				</Box>
				{name.slice(end)}
			</React.Fragment>
		);
	}

	if (!position) return null;

	const descriptionItem = items[active];

	const description = (
		<Box
			borderTopWidth='1px'
			borderColor='border.subtle'
			bg='var(--beak-colors-bg-canvas)'
			px='2.5'
			py='1.5'
			minH='36px'
			fontSize='11.5px'
			lineHeight='1.45'
			color='fg.muted'
			fontStyle={items.length > 0 ? 'italic' : 'normal'}
			css={{ '& > a': { color: 'var(--beak-colors-accent-pink)', textDecoration: 'underline' } }}
		>
			{items.length > 0 && descriptionItem?.external && (
				<Flex
					as='span'
					display='inline-flex'
					align='center'
					gap='1'
					mr='1.5'
					px='1.5'
					py='0.5'
					borderRadius='sm'
					borderWidth='1px'
					borderStyle='solid'
					color='accent.pink'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					fontStyle='normal'
				>
					<Plug size={9} strokeWidth={2.2} />
					<Box as='span' fontWeight='700' fontSize='9px' textTransform='uppercase' letterSpacing='0.06em'>
						{'Extension'}
					</Box>
				</Flex>
			)}
			{items.length > 0 && descriptionItem?.description}
			{items.length === 0 && (
				<React.Fragment>
					<Box as='strong' color='fg.default'>
						{'Missing a variable?'}
					</Box>{' '}
					{'Build your own with an extension — check the '}
					<chakra.a
						href='https://getbeak.notion.site/Extensions-4c16ca640b35460787056f8be815b904'
						color='accent.pink'
						fontWeight='600'
						textDecoration='underline'
						textDecorationStyle='dotted'
						_hover={{ textDecorationStyle: 'solid' }}
						onClick={async (event: React.MouseEvent) => {
							event.preventDefault();
							await ipcExplorerService.launchUrl('https://getbeak.notion.site/Extensions-4c16ca640b35460787056f8be815b904');
						}}
					>
						{'docs'}
					</chakra.a>
					{'.'}
				</React.Fragment>
			)}
		</Box>
	);

	const cardStyle: React.CSSProperties = {
		marginTop: `${position.top}px`,
		marginLeft: `${position.left}px`,
		width: 360,
		maxHeight: 280,
		display: 'flex',
		flexDirection: 'column',
		border: '1px solid var(--beak-colors-border-default)',
		borderRadius: 8,
		background: 'var(--beak-colors-bg-surface)',
		boxShadow: '0 18px 44px rgba(0,0,0,0.28), 0 6px 16px rgba(0,0,0,0.16)',
		overflow: 'hidden',
		fontSize: 13,
	};

	const matchCountLabel = items.length === 0 ? 'No matches' : items.length === 1 ? '1 match' : `${items.length} matches`;

	return (
		<Box
			position='fixed'
			inset='0'
			zIndex={101}
			onClick={event => {
				event.stopPropagation();
				onClose();
			}}
		>
			<motion.div
				role='listbox'
				aria-label='Variable suggestions'
				initial={{ opacity: 0, scale: 0.96, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: -4 }}
				transition={{ type: 'spring', stiffness: 700, damping: 36 }}
				style={cardStyle}
				onClick={event => event.stopPropagation()}
			>
				<Flex
					align='center'
					justify='space-between'
					gap='2'
					px='2.5'
					py='1.5'
					borderBottomWidth='1px'
					borderColor='border.subtle'
					bg='var(--beak-colors-bg-canvas)'
					fontSize='10px'
					letterSpacing='0.07em'
					textTransform='uppercase'
					fontWeight='700'
					color='fg.subtle'
				>
					<Flex align='center' gap='1.5'>
						<Box
							display='inline-flex'
							alignItems='center'
							justifyContent='center'
							w='14px'
							h='14px'
							borderRadius='sm'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)'
							color='accent.pink'
							fontFamily='var(--beak-fonts-mono)'
							fontWeight='700'
							fontSize='11px'
							lineHeight='1'
							boxShadow='inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
						>
							{'{'}
						</Box>
						<Box>{'Insert variable'}</Box>
					</Flex>
					<Box color={items.length === 0 ? 'fg.disabled' : 'fg.subtle'}>{matchCountLabel}</Box>
				</Flex>
				<Box flex='1 1 auto' overflowY='auto' py='1'>
					{query && (
						<Box
							px='2'
							py='1'
							fontSize='11px'
							color='fg.subtle'
							borderBottomWidth='1px'
							borderColor='border.subtle'
							mb='1'
							css={{ '> strong': { color: 'var(--beak-colors-fg-default)', fontWeight: 600 } }}
						>
							{'Searching '}
							<strong>{`"${query}"`}</strong>
						</Box>
					)}
					{items.length === 0 && (
						<Flex direction='column' align='center' gap='2' py='6' textAlign='center'>
							<Flex
								align='center'
								justify='center'
								w='40px'
								h='40px'
								borderRadius='full'
								bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
								color='accent.pink'
								boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
							>
								<SearchX size={18} strokeWidth={1.8} />
							</Flex>
							<Box fontSize='sm' color='fg.default' fontWeight='600' letterSpacing='-0.005em'>
								{'No matching variables'}
							</Box>
							<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.pink'>
								{'Try a different query'}
							</Box>
						</Flex>
					)}
					{items.map((i, idx) => {
						const isActive = active === idx;
						return (
							<Box
								key={i.type}
								ref={(el: HTMLDivElement | null) => {
									if (isActive) activeRef.current = el;
								}}
								role='option'
								aria-selected={isActive}
								tabIndex={0}
								position='relative'
								px='2.5'
								py='1.5'
								mx='1'
								borderRadius='md'
								cursor='pointer'
								color={isActive ? 'fg.default' : 'fg.muted'}
								transition='color .12s ease, background-color .12s ease, transform .08s ease'
								_hover={{
									color: 'fg.default',
									bg: isActive ? undefined : 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
								}}
								_focusVisible={{
									outline: 'none',
									boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, transparent)',
								}}
								onClick={() => setActive(idx)}
								onDoubleClick={() => createDefaultVariable(i)}
							>
								{isActive && (
									<Box
										position='absolute'
										inset='0'
										borderRadius='md'
										bg='color-mix(in srgb, var(--beak-colors-accent-pink) 20%, transparent)'
										boxShadow='inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)'
										pointerEvents='none'
									/>
								)}
								{isActive && (
									<Box
										position='absolute'
										top='4px'
										bottom='4px'
										left='-1px'
										w='3px'
										bg='accent.pink'
										borderRadius='full'
										boxShadow='0 0 8px color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)'
										pointerEvents='none'
									/>
								)}
								<Flex position='relative' align='center' gap='2'>
									{i.external && (
										<Box color={isActive ? 'accent.pink' : 'fg.subtle'} flex='0 0 auto' display='inline-flex'>
											<Plug size={11} strokeWidth={2.1} />
										</Box>
									)}
									<Box
										flex='1 1 auto'
										overflow='hidden'
										textOverflow='ellipsis'
										whiteSpace='nowrap'
										fontSize='sm'
										fontWeight={isActive ? '600' : '500'}
										letterSpacing='-0.005em'
									>
										{renderHighlightedName(i.name)}
									</Box>
									{i.sensitive && (
										<Box
											display='inline-flex'
											alignItems='center'
											flex='0 0 auto'
											color={isActive ? 'accent.warning' : 'fg.subtle'}
											title='Sensitive: value is hidden by default'
										>
											<Lock size={10} strokeWidth={2.2} />
										</Box>
									)}
								</Flex>
							</Box>
						);
					})}
				</Box>
				{description}
				<Flex
					align='center'
					justify='flex-end'
					gap='2.5'
					px='2'
					py='1.5'
					borderTopWidth='1px'
					borderColor='border.subtle'
					bg='var(--beak-colors-bg-canvas)'
					fontSize='10px'
					letterSpacing='0.04em'
					color='fg.subtle'
				>
					<Flex align='center' gap='1'>
						<Kbd>{'↑'}</Kbd>
						<Kbd>{'↓'}</Kbd>
						<Box as='span'>{'navigate'}</Box>
					</Flex>
					<Box w='1px' h='10px' bg='border.subtle' />
					<Flex align='center' gap='1'>
						<Kbd>{'↵'}</Kbd>
						<Box as='span'>{'insert'}</Box>
					</Flex>
					<Box w='1px' h='10px' bg='border.subtle' />
					<Flex align='center' gap='1'>
						<Kbd>{'esc'}</Kbd>
						<Box as='span'>{'close'}</Box>
					</Flex>
				</Flex>
			</motion.div>
		</Box>
	);
};

export default VariableSelector;
