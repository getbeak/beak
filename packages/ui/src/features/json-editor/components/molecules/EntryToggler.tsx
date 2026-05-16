import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra } from '@chakra-ui/react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	/**
	 * Value-mode display state — the entry's `enabled` flag. In schema mode
	 * the toggler reads `required` from the entry directly via context, so
	 * this prop is ignored when `schemaMode` is on.
	 */
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const ToggleButton = chakra('button');

/**
 * Per-entry switch. In Value mode it toggles `enabled` (skip this field on
 * the wire); in Schema mode it toggles `required` (this field must be
 * filled in). Same chrome both modes — accent colour shifts to indigo when
 * authoring the contract so the meaning reads visually.
 */
const EntryToggler: React.FC<EntryTogglerProps> = ({ requestId, id, value, onChange }) => {
	const editorContext = useContext(JsonEditorContext)!;
	const entries = useAppSelector(editorContext.editorSelector);
	const dispatch = useDispatch();

	const schemaMode = editorContext.schemaMode;
	const displayValue = schemaMode ? entries[id]?.required === true : value;
	const accent = schemaMode ? 'accent.indigo' : 'accent.pink';
	const accentVar = schemaMode ? 'var(--beak-colors-accent-indigo)' : 'var(--beak-colors-accent-pink)';
	const ariaLabel = schemaMode
		? displayValue
			? 'Mark optional'
			: 'Mark required'
		: displayValue
			? 'Disable entry'
			: 'Enable entry';

	function handle(next: boolean) {
		if (schemaMode) {
			dispatch(editorContext.requiredChange({ requestId, id, required: next ? true : null }));
		} else {
			dispatch(editorContext.enabledChange({ requestId, id, enabled: next }));
		}
		onChange?.(next);
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
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
			aria-label={ariaLabel}
			title={ariaLabel}
			tabIndex={0}
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
			cursor='pointer'
			transition='background-color .18s ease, border-color .18s ease, box-shadow .18s ease'
			_hover={{
				borderColor: displayValue ? accent : 'fg.muted',
			}}
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
