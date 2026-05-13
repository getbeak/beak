import { Box, Flex, chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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
			boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
		},
	},
});

/**
 * Beak's labelled checkbox. Hides the native input and renders a custom
 * 14×14 box that paints a check icon on tick (framer-motion entrance).
 * The native input retains keyboard + a11y semantics.
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
					w='14px'
					h='14px'
					borderRadius='sm'
					borderWidth='1px'
					borderColor={isChecked ? 'accent.pink' : 'border.default'}
					bg={
						isChecked
							? 'color-mix(in srgb, var(--beak-colors-accent-pink) 80%, transparent)'
							: 'var(--beak-colors-bg-surface)'
					}
					transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease'
					pointerEvents='none'
				>
					{isChecked && (
						<motion.span
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.14, ease: 'easeOut' }}
							style={{ display: 'inline-flex' }}
						>
							<Check size={10} strokeWidth={3} color='white' />
						</motion.span>
					)}
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
