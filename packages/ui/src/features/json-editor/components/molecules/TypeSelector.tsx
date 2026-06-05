import { Box } from '@chakra-ui/react';
import type { EntryType } from '@getbeak/types/body-editor-json';
import { AlignJustify, Ban, Calculator, CircleCheck, Layers, ListFilter, OctagonAlert, Type } from 'lucide-react';
import * as React from 'react';
import { useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface TypeSelectorProps {
	disabled?: boolean;
	requestId: string;
	id: string;
	value: EntryType;
	/**
	 * Restrict which types appear in the dropdown. The root of a JSON body
	 * passes `['object', 'array']` so users can't accidentally turn the whole
	 * body into a bare primitive — primitives at root make sense in the
	 * spec but almost never match what an API request actually wants to send.
	 */
	allowedTypes?: EntryType[];
	onChange?: (entryType: EntryType) => void;
}

const PRIMITIVE_TYPES: EntryType[] = ['string', 'number', 'boolean', 'null', 'enum'];
const CONTAINER_TYPES: EntryType[] = ['array', 'object'];

const TYPE_COLOUR: Record<EntryType, string> = {
	string: 'var(--beak-colors-accent-teal)',
	number: 'var(--beak-colors-accent-indigo)',
	boolean: 'var(--beak-colors-accent-warning)',
	null: 'var(--beak-colors-fg-subtle)',
	enum: 'var(--beak-colors-accent-indigo)',
	array: 'var(--beak-colors-accent-pink)',
	object: 'var(--beak-colors-accent-pink)',
};

/**
 * Type selector renders a coloured chip showing the entry's type. The whole
 * column is clickable — the native `<select>` stretches to fill the parent
 * cell, sitting invisibly above the chip. This way the user can hit anywhere
 * in the Type column rather than fishing for the tiny icon button.
 */
const TypeSelector: React.FC<TypeSelectorProps> = ({ disabled, requestId, id, value, allowedTypes, onChange }) => {
	const selectRef = useRef<HTMLSelectElement>(null);
	const Icon = getIconForType(value);
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;
	const colour = TYPE_COLOUR[value] ?? 'var(--beak-colors-fg-muted)';
	const allowedSet = allowedTypes ? new Set(allowedTypes) : null;
	const showPrimitives = !allowedSet || PRIMITIVE_TYPES.some(t => allowedSet.has(t));
	const showContainers = !allowedSet || CONTAINER_TYPES.some(t => allowedSet.has(t));
	// `valuesOnly` locks the schema — the chip stays visible as a read-only
	// signal, but the click-through `<select>` is gone so the user can't
	// retype the field.
	const locked = disabled || editorContext.valuesOnly;

	return (
		<Box
			position='relative'
			w='100%'
			h='100%'
			display='flex'
			alignItems='center'
			justifyContent='center'
			cursor={locked ? 'default' : 'pointer'}
		>
			{!editorContext.valuesOnly && (
				<select
					ref={selectRef}
					aria-label={`Type: ${value}`}
					disabled={disabled}
					value={value}
					tabIndex={-1}
					style={{
						position: 'absolute',
						inset: 0,
						margin: 0,
						padding: 0,
						opacity: 0,
						width: '100%',
						height: '100%',
						cursor: disabled ? 'default' : 'pointer',
					}}
					onChange={e => {
						const type = e.currentTarget.value as EntryType;
						dispatch(editorContext.typeChange({ requestId, id, type }));
						onChange?.(type);
						selectRef.current!.blur();
					}}
				>
					{showPrimitives && (
						<optgroup label='Primitives'>
							{(!allowedSet || allowedSet.has('string')) && <option value='string'>{'String'}</option>}
							{(!allowedSet || allowedSet.has('number')) && <option value='number'>{'Number'}</option>}
							{(!allowedSet || allowedSet.has('boolean')) && <option value='boolean'>{'Boolean'}</option>}
							{(!allowedSet || allowedSet.has('null')) && <option value='null'>{'Null'}</option>}
							{(!allowedSet || allowedSet.has('enum')) && <option value='enum'>{'Enum'}</option>}
						</optgroup>
					)}
					{showContainers && (
						<optgroup label='Objects'>
							{(!allowedSet || allowedSet.has('array')) && <option value='array'>{'Array'}</option>}
							{(!allowedSet || allowedSet.has('object')) && <option value='object'>{'Object'}</option>}
						</optgroup>
					)}
				</select>
			)}
			<Box
				w='22px'
				h='22px'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				pointerEvents='none'
				borderRadius='sm'
				borderWidth='1px'
				transition='border-color .12s ease, background-color .12s ease, box-shadow .12s ease'
				style={{
					color: colour,
					background: `color-mix(in srgb, ${colour} 14%, transparent)`,
					borderColor: `color-mix(in srgb, ${colour} 38%, var(--beak-colors-border-subtle))`,
					boxShadow: `0 1px 2px color-mix(in srgb, ${colour} 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)`,
				}}
			>
				<Icon size={12} strokeWidth={2} />
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
		case 'enum':
			return ListFilter;
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
