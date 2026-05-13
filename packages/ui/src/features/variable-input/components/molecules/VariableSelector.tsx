import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableManager } from '@beak/ui/features/variables';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { ipcExplorerService, ipcExtensionsService } from '@beak/ui/lib/ipc';
import { useAppSelector } from '@beak/ui/store/redux';
import { movePosition } from '@beak/ui/utils/arrays';
import { Plug } from 'lucide-react';

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

		if (!query)
			return all;

		const fuse = new Fuse(all, {
			includeScore: true,
			keys: [
				'name',
				'description',
				'keywords',
			],
		});

		return fuse.search(query)
			.sort()
			.map(r => r.item)
			.sort();
	}, [variableSets, query]);

	useEffect(() => {
		if (!sel)
			return;

		const node = editableElement.childNodes[sel.partIndex];

		if (!node)
			return;

		const range = new Range();

		range.selectNode(node);

		const rect = range.getBoundingClientRect();

		const contentLength = (node.textContent ?? '').length;
		const positionOffset = sel.offset / contentLength;
		const width = rect.width;
		const offsetDelta = width * positionOffset;

		setPosition({
			left: rect.left + offsetDelta,
			top: rect.top + rect.height + 5,
		});
	}, [Boolean(sel), editableElement]);

	useEffect(() => {
		// This actually exists
		// @ts-expect-error
		activeRef.current?.scrollIntoViewIfNeeded(false);
	}, [activeRef, active]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey)
				return;

			if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key))
				return;

			switch (event.key) {
				case 'ArrowUp':
				case 'ArrowDown': {
					let newIndex = active;

					if (event.key === 'ArrowUp')
						newIndex = movePosition(items, active, 'backward');
					else if (event.key === 'ArrowDown')
						newIndex = movePosition(items, active, 'forward');

					setActive(newIndex);
					break;
				}

				case 'Enter': {
					const item = items[active];

					if (!item)
						return;

					createDefaultVariable(item);
					break;
				}

				case 'Escape':
					onClose();

					break;

				default: return;
			}

			event.preventDefault();
		}

		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
	}, [active, items]);

	async function createDefaultVariable(item: VariableStaticInformation) {
		let payload: any;

		if (item.external)
			payload = await ipcExtensionsService.rtvCreateDefaultPayload({ type: item.type, context });
		else
			payload = await (item as Variable<any>).createDefaultPayload(context);

		onDone({ type: item.type, payload });
	}

	if (!position)
		return null;

	const wrapperBase = {
		display: 'flex',
		h: '160px',
		w: '375px',
		flexDirection: 'column' as const,
		borderWidth: '1px',
		borderColor: 'border.default',
		bg: 'bg.surface',
		transformOrigin: 'center',
		animation: 'beakVarSelectorScale .2s ease',
		transition: 'transform .1s ease',
		fontSize: 'sm',
	};
	const wrapperStyle = {
		marginTop: `${position.top}px`,
		marginLeft: `${position.left}px`,
	};
	const description = (
		<Box
			borderTopWidth='1px'
			borderColor='border.default'
			bg='bg.canvas'
			p='1.5'
			minH='30px'
			css={{ '> a': { color: '#ffa210' } }}
		>
			{items.length > 0 && items[active]?.external && '(Extension) '}
			{items.length > 0 && items[active]?.description}
			{items.length === 0 && (
				<React.Fragment>
					<strong>{'Missing a variable you would find useful?'}</strong>
					<br />
					{'You can build your own with an extension, check the '}
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

	if (items.length === 0) {
		return (
			<Box
				position='fixed'
				inset='0'
				zIndex={101}
				css={{
					'@keyframes beakVarSelectorScale': {
						'0%': { transform: 'scale(.97)', opacity: 0 },
						'100%': { transform: 'scale(1)', opacity: 1 },
					},
				}}
				onClick={event => {
					event.stopPropagation();
					onClose();
				}}
			>
				<Box {...wrapperBase} style={wrapperStyle}>
					<Box flexGrow={2} overflowY='auto'>
						<Box p='2.5' cursor='pointer' color='fg.default' overflowX='hidden'>
							{'There are no variables matching your search. Try widening '}
							{'your horizons.'}
						</Box>
					</Box>
					{description}
				</Box>
			</Box>
		);
	}

	return (
		<Box
			position='fixed'
			inset='0'
			zIndex={101}
			css={{
				'@keyframes beakVarSelectorScale': {
					'0%': { transform: 'scale(.97)', opacity: 0 },
					'100%': { transform: 'scale(1)', opacity: 1 },
				},
			}}
			onClick={event => {
				event.stopPropagation();
				onClose();
			}}
		>
			<Box {...wrapperBase} style={wrapperStyle}>
				<Box flexGrow={2} overflowY='auto'>
					{items.map((i, idx) => (
						<Box
							key={uuid.v4()}
							ref={(el: HTMLDivElement | null) => {
								if (active === idx) activeRef.current = el;
							}}
							tabIndex={0}
							px='1'
							py='0.5'
							cursor='pointer'
							color='fg.default'
							overflowX='hidden'
							bg={active === idx ? 'accent.pink' : undefined}
							_focus={{ bg: 'accent.pink', outline: 'none' }}
							onClick={() => setActive(idx)}
							onDoubleClick={() => createDefaultVariable(i)}
						>
							{i.external && (
								<Box display='inline-block' mr='1.5'>
									<Plug id='tt-variable-input-extension' />
								</Box>
							)}
							{i.name}
						</Box>
					))}
				</Box>
				{description}
			</Box>
		</Box>
	);
};

export default VariableSelector;
