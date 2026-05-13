import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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
			w='26px'
			h='14px'
			minW='26px'
			p='1.5px'
			borderRadius='full'
			borderWidth='1px'
			borderColor={value ? 'accent.pink' : 'border.emphasized'}
			bg={value ? 'accent.pink' : 'bg.surface.emphasized'}
			display='inline-flex'
			alignItems='center'
			cursor='pointer'
			transition='background-color .18s ease, border-color .18s ease'
			_hover={{
				borderColor: value ? 'accent.pink' : 'fg.muted',
			}}
			_focus={{
				outline: 'none',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)',
			}}
		>
			<motion.span
				layout
				transition={{ type: 'spring', stiffness: 700, damping: 32 }}
				style={{
					display: 'block',
					width: 9,
					height: 9,
					borderRadius: '50%',
					background: value ? '#ffffff' : 'var(--beak-colors-fg-subtle)',
					marginLeft: value ? 'auto' : 0,
					boxShadow: value ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
				}}
			/>
		</ToggleButton>
	);
};

export default EntryToggler;
