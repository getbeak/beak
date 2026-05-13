import { Box, Flex, chakra } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import * as React from 'react';

interface CheckboxProps extends Omit<React.HTMLProps<HTMLInputElement>, 'as' | 'label'> {
	label: string;
}

const HiddenInput = chakra('input', {
	base: {
		position: 'absolute',
		opacity: 0,
		w: '16px',
		h: '16px',
		m: 0,
		cursor: 'pointer',
		'&:focus + span': {
			boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)',
		},
		'&:hover:not(:checked) + span': {
			borderColor: 'var(--beak-colors-accent-pink)',
		},
	},
});

/**
 * Beak's labelled checkbox. Hides the native input and renders a 16×16
 * custom box that paints a check icon on tick. The native input retains
 * keyboard + a11y semantics; the visual box reads as a real toggle with
 * a soft pink glow when active.
 */
const Checkbox: React.FC<CheckboxProps> = ({ label, ...rest }) => {
	const isChecked = Boolean(rest.checked);

	return (
		<Flex align='center' gap='2'>
			<Box position='relative' display='inline-flex' alignItems='center' justifyContent='center'>
				<HiddenInput type='checkbox' {...rest} />
				<Box
					as='span'
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					w='16px'
					h='16px'
					borderRadius='sm'
					borderWidth='1px'
					borderColor={isChecked ? 'accent.pink' : 'border.default'}
					bg={isChecked ? 'accent.pink' : 'var(--beak-colors-bg-surface)'}
					boxShadow={isChecked ? '0 0 0 0.5px color-mix(in srgb, white 22%, transparent) inset, 0 2px 6px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)' : 'inset 0 1px 2px rgba(0,0,0,0.04)'}
					transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease, transform .08s ease'
					pointerEvents='none'
				>
					<Box
						as='span'
						display='inline-flex'
						color='fg.onAccent'
						opacity={isChecked ? 1 : 0}
						transform={isChecked ? 'scale(1)' : 'scale(0.5)'}
						transition='opacity .14s ease, transform .14s ease'
					>
						<Check size={11} strokeWidth={3} />
					</Box>
				</Box>
			</Box>
			<label
				htmlFor={rest.id}
				style={{
					color: 'var(--beak-colors-fg-default)',
					fontSize: '12px',
					cursor: 'pointer',
					userSelect: 'none',
				}}
			>
				{label}
			</label>
		</Flex>
	);
};

export default Checkbox;
