import { Box } from '@chakra-ui/react';
import { AlignJustify, Ban, Calculator, CircleCheck, Layers, OctagonAlert, Type } from 'lucide-react';
import type { EntryType } from '@getbeak/types/body-editor-json';
import * as React from 'react';
import { useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface TypeSelectorProps {
	disabled?: boolean;
	requestId: string;
	id: string;
	value: EntryType;
	onChange?: (entryType: EntryType) => void;
}

const TYPE_COLOUR: Record<EntryType, string> = {
	string: 'var(--beak-colors-accent-teal)',
	number: 'var(--beak-colors-accent-indigo)',
	boolean: 'var(--beak-colors-accent-warning)',
	null: 'var(--beak-colors-fg-subtle)',
	array: 'var(--beak-colors-accent-pink)',
	object: 'var(--beak-colors-accent-pink)',
};

const TypeSelector: React.FC<TypeSelectorProps> = ({ disabled, requestId, id, value, onChange }) => {
	const selectRef = useRef<HTMLSelectElement>(null);
	const Icon = getIconForType(value);
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;
	const colour = TYPE_COLOUR[value] ?? 'var(--beak-colors-fg-muted)';

	return (
		<Box position='relative'>
			<select
				ref={selectRef}
				disabled={disabled}
				value={value}
				tabIndex={-1}
				style={{
					position: 'absolute',
					margin: '0 auto',
					opacity: 0,
					width: '100%',
					height: '22px',
					cursor: 'pointer',
				}}
				onChange={e => {
					const type = e.currentTarget.value as EntryType;
					dispatch(editorContext.typeChange({ requestId, id, type }));
					onChange?.(type);
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
			</select>
			<Box
				py='0.5'
				w='22px'
				h='22px'
				mx='auto'
				mt='0.5'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				pointerEvents='none'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.default'
				transition='border-color .12s ease, background-color .12s ease'
				style={{
					color: colour,
					background: `color-mix(in srgb, ${colour} 12%, transparent)`,
					borderColor: `color-mix(in srgb, ${colour} 35%, var(--beak-colors-border-default))`,
				}}
			>
				<Icon size={12} />
			</Box>
		</Box>
	);
};

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
