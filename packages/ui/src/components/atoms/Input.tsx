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
	padding: (s || 'md') === 'md' ? '3px 5px' : '2px 3px',
	borderRadius: (s || 'md') === 'md' ? '4px' : '3px',
});

const Input = React.forwardRef<HTMLInputElement, InputElProps>(({ $beakSize, $noStretch, style, ...rest }, ref) => {
	const sz = sizeFor($beakSize);
	return (
		<input
			ref={ref}
			{...rest}
			style={{
				backgroundColor: 'var(--beak-colors-bg-surface)',
				color: 'var(--beak-colors-fg-muted)',
				border: '1px solid var(--beak-colors-accent-pink)',
				boxSizing: 'border-box',
				width: $noStretch ? undefined : '100%',
				...sz,
				...(style || {}),
			}}
		/>
	);
});
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, SelectElProps>(({ $beakSize, $noStretch, style, ...rest }, ref) => {
	const sz = sizeFor($beakSize);
	return (
		<select
			ref={ref}
			{...rest}
			style={{
				backgroundColor: 'var(--beak-colors-bg-surface)',
				color: 'var(--beak-colors-fg-muted)',
				border: '1px solid var(--beak-colors-border-default)',
				boxSizing: 'border-box',
				width: $noStretch ? 'fit-content' : '100%',
				...sz,
				...(style || {}),
			}}
		/>
	);
});
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
