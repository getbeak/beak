import { movePosition } from '@beak/app/utils/arrays';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RealtimeValuePart } from '@beak/common/types/beak-project';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { getRealtimeValues } from '../../../realtime-values';
import { RealtimeValue } from '../../../realtime-values/types';
import { createFauxValue } from '../../../realtime-values/values/variable-group-item';

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

	const activeRef = useRef<HTMLDivElement>();
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const [active, setActive] = useState<number>(0);
	const context = { projectPath, selectedGroups, variableGroups };

	const items: RealtimeValue<any>[] = useMemo(() => ([
		...getRealtimeValues(),

		// Variable groups act a little differently
		...TypedObject.keys(variableGroups)
			.map(vgKey => {
				const vg = variableGroups[vgKey];

				return TypedObject.keys(vg.items).map(i => createFauxValue({ itemId: i }, variableGroups));
			})
			.flat(),
	]), [variableGroups]);

	useEffect(() => {
		// This actually exists
		// @ts-ignore
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

					// fucking love a promise
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

	return (
		<Container onClick={() => onClose()}>
			<Wrapper
				top={position.top}
				left={position.left}
				onClick={event => void event.stopPropagation()}
			>
				<ItemContainer>
					{items.map((i, idx) => (
						<Item
							ref={(i: HTMLDivElement) => {
								if (active === idx)
									activeRef.current = i;
							}}
							active={active === idx}
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
				<Description>
					{items[active]?.description}
				</Description>
			</Wrapper>
		</Container>
	);
};

const Container = styled.div`
	z-index: 101;
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const Wrapper = styled.div<{ top: number; left: number }>`
	display: flex;
	height: 120px; width: 325px;
	flex-direction: column;
	margin-top: ${p => p.top}px;
	margin-left: ${p => p.left}px;

	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};

	font-size: 12px;
`;

const ItemContainer = styled.div`
	flex-grow: 2;

	overflow-y: auto;
`;

const Item = styled.div<{ active: boolean }>`
	padding: 2px 4px;
	cursor: pointer;
	color: ${p => p.theme.ui.textOnAction};
	overflow-x: hidden;

	&:focus {
		background-color: ${p => p.theme.ui.primaryFill};
		outline: none;
	}

	${p => p.active ? `background-color: ${p.theme.ui.primaryFill};'` : ''}
`;

const Description = styled.div`
	border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.background};

	padding: 3px 4px;
`;

export default VariableSelector;
