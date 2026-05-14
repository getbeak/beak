import { chakra } from '@chakra-ui/react';
import * as React from 'react';

interface SizingProps {
	$beakSize?: 'sm' | 'md';
	$noStretch?: boolean;
}

type InputElProps = React.InputHTMLAttributes<HTMLInputElement> & SizingProps;
type SelectElProps = React.SelectHTMLAttributes<HTMLSelectElement> & SizingProps;

const sizeFor = (s: 'sm' | 'md' | undefined) => ({
	fontSize: (s || 'md') === 'md' ? '13px' : '12px',
	padding: (s || 'md') === 'md' ? '6px 10px' : '4px 8px',
	borderRadius: (s || 'md') === 'md' ? '6px' : '5px',
	lineHeight: '1.25',
});

const baseInput = {
	backgroundColor: 'var(--beak-colors-bg-surface)',
	color: 'var(--beak-colors-fg-default)',
	border: '1px solid var(--beak-colors-border-default)',
	boxSizing: 'border-box' as const,
	outline: 'none',
	caretColor: 'var(--beak-colors-accent-pink)',
	transition: 'border-color .14s ease, box-shadow .14s ease, background-color .14s ease',
};

const inputCss = {
	'&:hover:not(:disabled)': {
		borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 55%, var(--beak-colors-border-default))',
		backgroundColor: 'color-mix(in srgb, var(--beak-colors-bg-surface) 92%, var(--beak-colors-bg-surface-alt))',
	},
	'&:focus, &:focus-visible': {
		borderColor: 'var(--beak-colors-accent-pink)',
		boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)',
	},
	'&:disabled': {
		opacity: 0.55,
		cursor: 'not-allowed',
		backgroundColor: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
	},
	'&::placeholder': { color: 'var(--beak-colors-fg-subtle)' },
	'&[aria-invalid="true"]': {
		borderColor: 'var(--beak-colors-accent-alert)',
		boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-alert) 22%, transparent)',
	},
};

const ChakraInput = chakra('input', { base: inputCss });
const ChakraSelect = chakra('select', { base: inputCss });

const Input = React.forwardRef<HTMLInputElement, InputElProps>(({ $beakSize, $noStretch, style, ...rest }, ref) => {
	const sz = sizeFor($beakSize);
	return (
		<ChakraInput
			ref={ref}
			{...rest}
			style={{
				...baseInput,
				width: $noStretch ? undefined : '100%',
				...sz,
				...(style || {}),
			}}
		/>
	);
});
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, SelectElProps>(
	({ $beakSize, $noStretch, style, ...rest }, ref) => {
		const sz = sizeFor($beakSize);
		return (
			<ChakraSelect
				ref={ref}
				{...rest}
				style={{
					...baseInput,
					width: $noStretch ? 'fit-content' : '100%',
					...sz,
					...(style || {}),
				}}
			/>
		);
	},
);
Select.displayName = 'Select';

export const InputInvalidText = chakra('span', {
	base: {
		display: 'block',
		py: '0.5',
		fontSize: 'xs',
		fontWeight: '500',
		color: 'accent.alert',
	},
});

export default Input;
