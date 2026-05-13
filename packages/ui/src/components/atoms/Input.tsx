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
	padding: (s || 'md') === 'md' ? '3px 6px' : '2px 4px',
	borderRadius: (s || 'md') === 'md' ? '4px' : '3px',
});

const baseInput = {
	backgroundColor: 'var(--beak-colors-bg-surface)',
	color: 'var(--beak-colors-fg-default)',
	border: '1px solid var(--beak-colors-border-default)',
	boxSizing: 'border-box' as const,
	outline: 'none',
	transition: 'border-color .12s ease, box-shadow .12s ease, background-color .12s ease',
};

const inputCss = {
	'&:hover': { borderColor: 'var(--beak-colors-accent-pink)' },
	'&:focus': {
		borderColor: 'var(--beak-colors-accent-pink)',
		boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 25%, transparent)',
	},
	'&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
	'&::placeholder': { color: 'var(--beak-colors-fg-subtle)' },
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
		fontSize: 'md',
		fontWeight: 'bold',
		color: 'accent.alert',
	},
});

export default Input;
