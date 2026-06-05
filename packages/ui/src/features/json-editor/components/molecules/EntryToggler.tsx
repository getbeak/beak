import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra } from '@chakra-ui/react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	/** Current `enabled` state for the entry — whether it'll fire on the wire. */
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const ToggleButton = chakra('button');

/**
 * Per-entry switch — toggles `enabled` (whether the field is sent on the
 * wire). Schema-side affordances (`required`) live in a separate control
 * inside the description cell, so this toggle keeps one consistent meaning
 * across Values and Schema modes.
 */
const EntryToggler: React.FC<EntryTogglerProps> = ({ requestId, id, value, onChange }) => {
	const editorContext = useContext(JsonEditorContext)!;
	const entries = useAppSelector(editorContext.editorSelector);
	const dispatch = useDispatch();

	const displayValue = value;
	// In `valuesOnly` mode, required-by-schema entries can't be disabled —
	// the linked request's contract pins them on. Normal editing stays live.
	const required = entries[id]?.required === true;
	const locked = editorContext.valuesOnly && required;
	const accent = 'accent.pink';
	const accentVar = 'var(--beak-colors-accent-pink)';
	const ariaLabel = locked
		? 'Required by schema — cannot be disabled for this step'
		: displayValue
			? 'Disable entry'
			: 'Enable entry';

	function handle(next: boolean) {
		if (locked) return;
		dispatch(editorContext.enabledChange({ requestId, id, enabled: next }));
		onChange?.(next);
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (locked) return;
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handle(!displayValue);
		}
	}

	return (
		<ToggleButton
			type='button'
			role='switch'
			aria-checked={displayValue}
			aria-disabled={locked || undefined}
			aria-label={ariaLabel}
			title={ariaLabel}
			tabIndex={locked ? -1 : 0}
			onClick={() => handle(!displayValue)}
			onKeyDown={onKeyDown}
			position='relative'
			w='26px'
			h='14px'
			minW='26px'
			p='0'
			borderRadius='full'
			borderWidth='1px'
			borderColor={displayValue ? accent : 'border.emphasized'}
			bg={displayValue ? accent : `color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)`}
			boxShadow={
				displayValue ? `0 0 12px color-mix(in srgb, ${accentVar} 35%, transparent)` : 'inset 0 1px 2px rgba(0,0,0,0.06)'
			}
			display='inline-flex'
			alignItems='center'
			cursor={locked ? 'not-allowed' : 'pointer'}
			opacity={locked ? 0.55 : 1}
			transition='background-color .18s ease, border-color .18s ease, box-shadow .18s ease, opacity .18s ease'
			_hover={
				locked
					? undefined
					: {
							borderColor: displayValue ? accent : 'fg.muted',
						}
			}
			_focusVisible={{
				outline: 'none',
				boxShadow: `0 0 0 2px color-mix(in srgb, ${accentVar} 50%, transparent)`,
			}}
		>
			<Box
				position='absolute'
				top='1px'
				left='1px'
				w='10px'
				h='10px'
				borderRadius='full'
				bg={displayValue ? 'fg.onAccent' : 'fg.subtle'}
				boxShadow={displayValue ? '0 1px 3px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.08)' : 'none'}
				transform={displayValue ? 'translateX(12px)' : 'translateX(0)'}
				transition='transform .2s cubic-bezier(.4, 0, .2, 1), background-color .18s ease'
			/>
		</ToggleButton>
	);
};

export default EntryToggler;
