import React, { useEffect, useMemo, useRef, useState } from 'react';
import useRealtimeValueContext from '@beak/app/features/realtime-values/hooks/use-realtime-value-context';
import { useAppSelector } from '@beak/app/store/redux';
import { movePosition } from '@beak/app/utils/arrays';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RealtimeValuePart } from '@beak/common/types/realtime-values';
import Fuse from 'fuse.js';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { getRealtimeValues } from '../../../realtime-values';
import { RealtimeValue } from '../../../realtime-values/types';
import { createFauxValue } from '../../../realtime-values/values/variable-group-item';
import { NormalizedSelection } from '../../utils/browser-selection';

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
	onDone: (value: RealtimeValuePart) => void;
}

const VariableSelector: React.FC<React.PropsWithChildren<VariableSelectorProps>> = props => {
	const { editableElement, sel, query, requestId, onClose, onDone } = props;
	const { variableGroups } = useAppSelector(s => s.global.variableGroups);

	const activeRef = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState<Position | null>(null);
	const [active, setActive] = useState<number>(0);
	const context = useRealtimeValueContext(requestId);

	const items: RealtimeValue<any>[] = useMemo(() => {
		const all = [
			...getRealtimeValues(requestId),

			// Variable groups act a little differently
			...TypedObject.keys(variableGroups)
				.map(vgKey => {
					const vg = variableGroups[vgKey];

					return TypedObject.keys(vg.items).map(i => createFauxValue({ itemId: i }, variableGroups));
				})
				.flat(),
		];

		if (!query)
			return all;

		const fuse = new Fuse(all, {
			includeScore: true,
			keys: [
				'name',
				'type',
				'description',
			],
		});

		return fuse.search(query)
			.map(r => r.item)
			.sort();
	}, [variableGroups, query]);

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
		activeRef.current?.scrollIntoViewIfNeeded();
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

					item.initValuePart(context).then(onDone);
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

	if (!position)
		return null;

	return (
		<Container onClick={event => {
			event.stopPropagation();
			onClose();
		}}>
			<Wrapper $top={position.top} $left={position.left}>
				<ItemContainer>
					{items.map((i, idx) => (
						<Item
							$active={active === idx}
							ref={i => {
								if (active === idx)
									activeRef.current = i;
							}}
							key={uuid.v4()}
							tabIndex={0}
							onClick={() => setActive(idx)}
							onDoubleClick={() => {
								i.initValuePart(context).then(onDone);
							}}
						>
							{i.name}
						</Item>
					))}
				</ItemContainer>
				<Description>{items[active]?.description}</Description>
			</Wrapper>
		</Container>
	);
};

const Container = styled.div`
	z-index: 101;
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const Wrapper = styled.div<{ $top: number; $left: number }>`
	display: flex;
	height: 160px; width: 375px;
	flex-direction: column;
	margin-top: ${p => p.$top}px;
	margin-left: ${p => p.$left}px;

	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};

	font-size: 12px;
`;

const ItemContainer = styled.div`
	flex-grow: 2;

	overflow-y: overlay;
`;

const Item = styled.div<{ $active: boolean }>`
	padding: 2px 4px;
	cursor: pointer;
	color: ${p => p.theme.ui.textOnAction};
	overflow-x: hidden;

	&:focus {
		background-color: ${p => p.theme.ui.primaryFill};
		outline: none;
	}

	${p => p.$active ? `background-color: ${p.theme.ui.primaryFill};'` : ''}
`;

const Description = styled.div`
	border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.background};

	padding: 5px;
	min-height: 30px;
`;

export default VariableSelector;
