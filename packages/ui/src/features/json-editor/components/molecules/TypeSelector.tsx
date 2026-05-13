import { AlignJustify, Ban, Calculator, CircleCheck, Layers, OctagonAlert, Type } from 'lucide-react';
import type { EntryType } from '@getbeak/types/body-editor-json';
import React, { useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface TypeSelectorProps {
	disabled?: boolean;
	requestId: string;
	id: string;
	value: EntryType;
	onChange?: (entryType: EntryType) => void;
}

const TypeSelector: React.FC<TypeSelectorProps> = props => {
	const { disabled, requestId, id, value, onChange } = props;
	const selectRef = useRef<HTMLSelectElement>(null);
	const Icon = getIconForType(value);
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;

	return (
		<Wrapper>
			<Select
				disabled={disabled}
				ref={selectRef}
				value={value}
				tabIndex={-1}
				onChange={e => {
					const type = e.currentTarget.value as EntryType;

					dispatch(
						editorContext.typeChange({
							requestId,
							id,
							type,
						}),
					);

					if (onChange) onChange(type);

					selectRef.current!.blur();
				}}
			>
				<optgroup label='Primitives'>
					<option value='string'>{'String'}</option>
					<option value='number'>{'Number'}</option>
					<option value='boolean'>{'Boolean'}</option>
					<option value='null'>{'Null'}</option>
				</optgroup>
				<optgroup label='Objects'>
					<option value='array'>{'Array'}</option>
					<option value='object'>{'Object'}</option>
				</optgroup>
			</Select>
			<Button>
				<Icon size={12} />
			</Button>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
`;

const Button = styled.div`
	padding: 1px 0;
	width: 22px;
	margin: 0 auto;
	margin-top: 1px;
	pointer-events: none;

	text-align: center;
	border-radius: 2px;
	border: 1px solid var(--beak-colors-border-default);
	color: var(--beak-colors-fg-muted);

	> svg {
		padding-top: 1px;
		transform: scale(0.9);
	}
`;

const Select = styled.select`
	position: absolute;

	margin: 0 auto;
	opacity: 0;
	width: 100%;
	height: 20px;

	&:disabled {
		cursor: not-allowed;
	}
`;

function getIconForType(type: EntryType) {
	switch (type) {
		case 'number':
			return Calculator;
		case 'boolean':
			return CircleCheck;
		case 'null':
			return Ban;
		case 'object':
			return AlignJustify;
		case 'array':
			return Layers;
		case 'string':
			return Type;
		default:
			return OctagonAlert;
	}
}

export default TypeSelector;
