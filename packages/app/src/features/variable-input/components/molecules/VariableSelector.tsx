import { movePosition } from '@beak/app/utils/arrays';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RealtimeValue, VariableGroupItem } from '@beak/common/types/beak-project';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { getImplementation, listValues } from '../../realtime-values';

export interface VariableSelectorProps {
	parent: HTMLElement;
	query: string;
	onDone: (value: RealtimeValue) => void;
	onClose: () => void;
	position: {
		top: number;
		left: number;
	};
	keyPassthrough?: {
		code: string;
		invalidator: string;
	};
}

interface Item {
	varibleGroupName: string;
	itemId: string;
	itemName: string;
}

const VariableSelector: React.FunctionComponent<VariableSelectorProps> = props => {
	const {
		onClose,
		onDone,
		position,
	} = props;

	const variableGroups = useSelector(s => s.global.variableGroups.variableGroups)!;
	const [active, setActive] = useState<number>(0);
	const items: RealtimeValue[] = [
		...listValues(),
		...TypedObject.keys(variableGroups)
			.map(vgKey => {
				const vg = variableGroups[vgKey];

				return TypedObject.keys(vg.items).reduce<VariableGroupItem[]>((acc, val) => ([
					...acc,
					{
						type: 'variable_group_item',
						payload: { itemId: val },
					},
				]), []);
			})
			.flat(),
	];

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

					onDone(item);
					break;
				}

				case 'Escape':
					onClose();

					break;

				default: break;
			}
		}

		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
	}, [active, items]);

	return (
		<Wrapper style={{ top: position.top, left: position.left }}>
			{items.map((i, idx) => {
				const impl = getImplementation(i.type);
				const { renderer } = impl.toHtml(i, variableGroups);

				return (
					<Item
						active={active === idx}
						key={uuid.v4()}
						tabIndex={0}
						onClick={() => setActive(idx)}
						onDoubleClick={() => onDone(i)}
					>
						<strong>{renderer.title}</strong>
						{renderer.body && ` (${renderer.body})`}
					</Item>
				);
			})}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: fixed;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};

	font-size: 12px;

	height: 120px; width: 325px;

	overflow-y: auto;
	z-index: 101; /* Cheaky... */
`;

const Item = styled.div<{ active: boolean }>`
	padding: 2px 4px;
	cursor: pointer;
	color: ${p => p.theme.ui.textOnAction};

	&:focus {
		background-color: ${p => p.theme.ui.primaryFill};
		outline: none;
	}

	${p => p.active ? `background-color: ${p.theme.ui.primaryFill};'` : ''}
`;

export default VariableSelector;
