import { Box, chakra } from '@chakra-ui/react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const ToggleButton = chakra('button');

const EntryToggler: React.FC<EntryTogglerProps> = ({ requestId, id, value, onChange }) => {
	const editorContext = useContext(JsonEditorContext)!;
	const dispatch = useDispatch();

	function handle(next: boolean) {
		dispatch(editorContext.enabledChange({ requestId, id, enabled: next }));
		onChange?.(next);
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handle(!value);
		}
	}

	return (
		<ToggleButton
			type='button'
			role='switch'
			aria-checked={value}
			aria-label={value ? 'Disable entry' : 'Enable entry'}
			title={value ? 'Disable entry' : 'Enable entry'}
			tabIndex={0}
			onClick={() => handle(!value)}
			onKeyDown={onKeyDown}
			position='relative'
			w='26px'
			h='14px'
			minW='26px'
			p='0'
			borderRadius='full'
			borderWidth='1px'
			borderColor={value ? 'accent.pink' : 'border.emphasized'}
			bg={value ? 'accent.pink' : 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)'}
			boxShadow={value ? '0 0 12px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)' : 'inset 0 1px 2px rgba(0,0,0,0.06)'}
			display='inline-flex'
			alignItems='center'
			cursor='pointer'
			transition='background-color .18s ease, border-color .18s ease, box-shadow .18s ease'
			_hover={{
				borderColor: value ? 'accent.pink' : 'fg.muted',
			}}
			_focus={{
				outline: 'none',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)',
			}}
		>
			<Box
				position='absolute'
				top='1px'
				left='1px'
				w='10px'
				h='10px'
				borderRadius='full'
				bg={value ? 'fg.onAccent' : 'fg.subtle'}
				boxShadow={value ? '0 1px 3px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.08)' : 'none'}
				transform={value ? 'translateX(12px)' : 'translateX(0)'}
				transition='transform .2s cubic-bezier(.4, 0, .2, 1), background-color .18s ease'
			/>
		</ToggleButton>
	);
};

export default EntryToggler;
