import { chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';

interface EntryTogglerProps {
	value: boolean;
	onChange: (enabled: boolean) => void;
}

const ToggleButton = chakra('button');

const EntryToggler: React.FC<EntryTogglerProps> = ({ value, onChange }) => {
	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			onChange(!value);
		}
	}

	return (
		<ToggleButton
			type='button'
			role='switch'
			aria-checked={value}
			tabIndex={0}
			onClick={() => onChange(!value)}
			onKeyDown={handleKeyDown}
			w='22px'
			h='12px'
			minW='22px'
			p='1px'
			borderRadius='full'
			borderWidth='1px'
			borderColor={value ? 'accent.pink' : 'border.default'}
			bg={
				value
					? 'color-mix(in srgb, var(--beak-colors-accent-pink) 25%, transparent)'
					: 'transparent'
			}
			display='inline-flex'
			alignItems='center'
			cursor='pointer'
			transition='background-color .15s ease, border-color .15s ease'
			_focus={{
				outline: 'none',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
			}}
		>
			<motion.span
				layout
				transition={{ type: 'spring', stiffness: 700, damping: 32 }}
				style={{
					display: 'block',
					width: 8,
					height: 8,
					borderRadius: '50%',
					background: value ? 'var(--beak-colors-accent-pink)' : 'var(--beak-colors-fg-muted)',
					marginLeft: value ? 'auto' : 0,
				}}
			/>
		</ToggleButton>
	);
};

export default EntryToggler;
