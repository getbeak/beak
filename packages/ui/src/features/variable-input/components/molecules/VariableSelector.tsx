import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableManager } from '@beak/ui/features/variables';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcExplorerService, ipcExtensionsService } from '@beak/ui/lib/ipc';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import { motion } from 'framer-motion';
import { Plug, SearchX } from 'lucide-react';

import type { Variable, VariableStaticInformation } from '@getbeak/extension-sdk';
import Fuse from 'fuse.js';
import * as uuid from 'uuid';

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
	onClose: () => void;
	onDone: (value: any) => void;
}

const VariableSelector: React.FC<React.PropsWithChildren<VariableSelectorProps>> = props => {
	const { editableElement, sel, query, requestId, onClose, onDone } = props;
	const { variableSets } = useAppSelector(s => s.global.variableSets);

	const activeRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState<Position | null>(null);
	const [active, setActive] = useState<number>(0);
	const context = useVariableContext(requestId);

	const items: VariableStaticInformation[] = useMemo(() => {
		const all: VariableStaticInformation[] = [
			...VariableManager.getVariables(requestId),

			// Variable sets act a little differently
			...TypedObject.keys(variableSets)
				.flatMap(vgKey => {
					const vg = variableSets[vgKey];

					return TypedObject.keys(vg.items).map(i => createFauxValue({ itemId: i }, variableSets));
				}),
		];

		if (!query) return all;

		const fuse = new Fuse(all, {
			includeScore: true,
			keys: ['name', 'description', 'keywords'],
		});

		return fuse.search(query).sort().map(r => r.item).sort();
	}, [variableSets, query]);

	useEffect(() => {
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
		setPosition({ left: rect.left + offsetDelta, top: rect.top + rect.height + 6 });
	}, [Boolean(sel), editableElement]);

	useEffect(() => {
		// @ts-expect-error scrollIntoViewIfNeeded exists in Chromium
		activeRef.current?.scrollIntoViewIfNeeded(false);
	}, [activeRef, active]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) return;
			if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) return;

			switch (event.key) {
				case 'ArrowUp':
				case 'ArrowDown': {
					const newIndex = event.key === 'ArrowUp'
						? movePosition(items, active, 'backward')
						: movePosition(items, active, 'forward');
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
			payload = await ipcExtensionsService.rtvCreateDefaultPayload({ type: item.type, context });
		} else {
			payload = await (item as Variable<any>).createDefaultPayload(context);
		}
		onDone({ type: item.type, payload });
	}

	if (!position) return null;

	const descriptionItem = items[active];

	const description = (
		<Box
			borderTopWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-canvas) 70%, transparent)'
			px='2'
			py='1.5'
			minH='32px'
			fontSize='xs'
			color='fg.muted'
			css={{ '> a': { color: 'var(--beak-colors-accent-pink)', textDecoration: 'underline' } }}
		>
			{items.length > 0 && descriptionItem?.external && (
				<Flex as='span' display='inline-flex' align='center' gap='1' mr='1' color='accent.pink'>
					<Plug size={10} />
					<Box as='span' fontWeight='600' fontSize='9px' textTransform='uppercase' letterSpacing='0.06em'>
						{'Extension'}
					</Box>
				</Flex>
			)}
			{items.length > 0 && descriptionItem?.description}
			{items.length === 0 && (
				<React.Fragment>
					<Box as='strong' color='fg.default'>{'Missing a variable?'}</Box>{' '}
					{'Build your own with an extension — check the '}
					<a
						href='https://getbeak.notion.site/Extensions-4c16ca640b35460787056f8be815b904'
						onClick={async event => {
							event.preventDefault();
							await ipcExplorerService.launchUrl(
								'https://getbeak.notion.site/Extensions-4c16ca640b35460787056f8be815b904',
							);
						}}
					>
						{'docs'}
					</a>
					{'.'}
				</React.Fragment>
			)}
		</Box>
	);

	const cardStyle: React.CSSProperties = {
		marginTop: `${position.top}px`,
		marginLeft: `${position.left}px`,
		width: 380,
		height: 220,
		display: 'flex',
		flexDirection: 'column',
		border: '1px solid var(--beak-colors-border-default)',
		borderRadius: 8,
		background: 'color-mix(in srgb, var(--beak-colors-bg-surface) 88%, transparent)',
		backdropFilter: 'blur(12px) saturate(160%)',
		boxShadow: '0 20px 48px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.2)',
		overflow: 'hidden',
		fontSize: 13,
	};

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
				initial={{ opacity: 0, scale: 0.96, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: -4 }}
				transition={{ type: 'spring', stiffness: 700, damping: 36 }}
				style={cardStyle}
				onClick={event => event.stopPropagation()}
			>
				<Box flex='1 1 auto' overflowY='auto'>
					{items.length === 0 && (
						<Flex direction='column' align='center' gap='2' py='6' color='fg.subtle'>
							<Box opacity={0.4}><SearchX size={22} /></Box>
							<Box fontSize='sm' color='fg.muted'>{'No matching variables'}</Box>
							<Box fontSize='xs' opacity={0.7}>{'Try a different query'}</Box>
						</Flex>
					)}
					{items.map((i, idx) => {
						const isActive = active === idx;
						return (
							<Box
								key={uuid.v4()}
								ref={(el: HTMLDivElement | null) => {
									if (isActive) activeRef.current = el;
								}}
								tabIndex={0}
								position='relative'
								px='2'
								py='1'
								cursor='pointer'
								color={isActive ? 'fg.default' : 'fg.muted'}
								transition='color .12s ease'
								_hover={{ color: 'fg.default' }}
								onClick={() => setActive(idx)}
								onDoubleClick={() => createDefaultVariable(i)}
							>
								{isActive && (
									<motion.div
										layoutId='var-selector-active'
										transition={{ type: 'spring', stiffness: 700, damping: 36 }}
										style={{
											position: 'absolute',
											inset: 0,
											background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
											pointerEvents: 'none',
										}}
									/>
								)}
								<Flex position='relative' align='center' gap='1.5'>
									{i.external && (
										<Box color={isActive ? 'accent.pink' : 'fg.subtle'} flex='0 0 auto'>
											<Plug size={11} />
										</Box>
									)}
									<Box overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
										{i.name}
									</Box>
								</Flex>
							</Box>
						);
					})}
				</Box>
				{description}
			</motion.div>
		</Box>
	);
};

export default VariableSelector;
