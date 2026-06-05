import { Box, chakra } from '@chakra-ui/react';
import * as React from 'react';

interface EntryTogglerProps {
	value: boolean;
	/**
	 * Lock the toggle to its current value. Used in `valuesOnly` mode to
	 * pin required-by-schema rows on — the user can't disable a contractually
	 * required field on a per-step basis. The toggle still renders so the
	 * "on" state is visible; clicks and keyboard activation no-op, and the
	 * `disabledReason` lands as a tooltip-friendly title.
	 */
	disabled?: boolean;
	disabledReason?: string;
	onChange: (enabled: boolean) => void;
}

const ToggleButton = chakra('button');

const EntryToggler: React.FC<EntryTogglerProps> = ({ value, disabled, disabledReason, onChange }) => {
	function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (disabled) return;
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			onChange(!value);
		}
	}

	const label = disabled ? (disabledReason ?? 'Required — cannot be disabled') : value ? 'Disable row' : 'Enable row';

	return (
		<ToggleButton
			type='button'
			role='switch'
			aria-checked={value}
			aria-disabled={disabled || undefined}
			aria-label={label}
			title={label}
			tabIndex={disabled ? -1 : 0}
			onClick={() => {
				if (disabled) return;
				onChange(!value);
			}}
			onKeyDown={handleKeyDown}
			position='relative'
			w='26px'
			h='14px'
			minW='26px'
			p='0'
			borderRadius='full'
			borderWidth='1px'
			borderColor={value ? 'accent.pink' : 'border.emphasized'}
			bg={value ? 'accent.pink' : 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)'}
			boxShadow={
				value
					? '0 0 12px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)'
					: 'inset 0 1px 2px rgba(0,0,0,0.06)'
			}
			display='inline-flex'
			alignItems='center'
			cursor={disabled ? 'not-allowed' : 'pointer'}
			opacity={disabled ? 0.55 : 1}
			transition='background-color .18s ease, border-color .18s ease, box-shadow .18s ease, opacity .18s ease'
			_hover={
				disabled
					? undefined
					: {
							borderColor: value ? 'accent.pink' : 'fg.muted',
						}
			}
			_focusVisible={{
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
