import { movePosition } from '@beak/app/utils/arrays';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RealtimeValuePart } from '@beak/common/types/beak-project';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { getRealtimeValues } from '../../realtime-values';
import { RealtimeValue } from '../../realtime-values/types';
import { createFauxGviRtv } from '../../realtime-values/variable-group-item';

export interface VariableSelectorProps {
	parent: HTMLElement;
	query: string;
	onDone: (value: RealtimeValuePart) => void;
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
	const items: RealtimeValue<any>[] = useMemo(() => ([
		...getRealtimeValues(),

		// Variable groups act a little differently
		...TypedObject.keys(variableGroups)
			.map(vgKey => {
				const vg = variableGroups[vgKey];

				return TypedObject.keys(vg.items).map(i => createFauxGviRtv({ itemId: i }, variableGroups));
			})
			.flat(),
	]), [variableGroups]);

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

					onDone(item.initValuePart(variableGroups));
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
			{items.map((i, idx) => (
				<Item
					active={active === idx}
					key={uuid.v4()}
					tabIndex={0}
					onClick={() => setActive(idx)}
					onDoubleClick={() => onDone(i.initValuePart(variableGroups))}
				>
					{i.name}
				</Item>
			))}
			<Description>
				{items[active]?.description}
			</Description>
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

const Description = styled.div`

`;

export default VariableSelector;
