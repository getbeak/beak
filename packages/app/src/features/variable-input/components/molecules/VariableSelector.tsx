import { movePosition } from '@beak/app/utils/arrays';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export interface VariableSelectorProps {
	parent: HTMLElement;
	query: string;
	onDone: (vg: string, itemId: string) => void;
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
	const [active, setActive] = useState<string | undefined>(void 0);

	const items = TypedObject.keys(variableGroups)
		.map(vgKey => {
			const vg = variableGroups[vgKey];

			return TypedObject.keys(vg.items).reduce<Item[]>((acc, val) => ([
				...acc,
				{
					varibleGroupName: vgKey,
					itemId: val,
					itemName: vg.items[val],
				},
			]), []);
		})
		.flat();

	useEffect(() => {
		if (!active)
			setActive(items[0]?.itemId || void 0);
	}, [active, setActive, items]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey)
				return;

			if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key))
				return;

			switch (event.key) {
				case 'ArrowUp':
				case 'ArrowDown': {
					const activeIndex = items.findIndex(i => i.itemId === active);
					let newIndex = activeIndex;

					if (event.key === 'ArrowUp')
						newIndex = movePosition(items, activeIndex, 'backward');
					else if (event.key === 'ArrowDown')
						newIndex = movePosition(items, activeIndex, 'forward');

					setActive(items[newIndex].itemId);
					break;
				}

				case 'Enter': {
					const item = items.find(i => i.itemId === active);

					if (!item)
						return;

					onDone(item.varibleGroupName, item.itemId);
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
		<Wrapper style={{
			top: position.top,
			left: position.left,
		}}>
			{items.map(i => (
				<Item
					active={active === i.itemId}
					className={'variable-selector'}
					key={i.itemId}
					tabIndex={0}
					onClick={() => setActive(i.itemId)}
					onDoubleClick={() => onDone(i.varibleGroupName, i.itemId)}
				>
					{`${i.varibleGroupName} (${i.itemName})`}
				</Item>
			))}
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
