import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

export interface SegmentedItem<T extends string> {
	key: T;
	label: string;
	preview?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
	items: ReadonlyArray<SegmentedItem<T>>;
	value: T;
	onChange: (key: T) => void;
	ariaLabel: string;
	size?: 'sm' | 'md';
}

function SegmentedControl<T extends string>({
	items,
	value,
	onChange,
	ariaLabel,
	size = 'md',
}: SegmentedControlProps<T>) {
	const hasPreview = items.some(item => item.preview !== undefined);
	const segPad = size === 'sm' ? { px: '2.5', py: '1' } : { px: '3', py: '1.5' };
	const segFontSize = size === 'sm' ? 'xs' : 'sm';

	return (
		<Flex
			role='radiogroup'
			aria-label={ariaLabel}
			display='inline-flex'
			gap='0.5'
			p='0.5'
			borderRadius='lg'
			borderWidth='1px'
			borderStyle='solid'
			borderColor='border.subtle'
			bg='bg.surface.alt'
			boxShadow='inset 0 1px 0 color-mix(in srgb, white 6%, transparent)'
		>
			{items.map(item => {
				const active = item.key === value;
				return (
					<Box
						key={item.key}
						role='radio'
						tabIndex={0}
						aria-checked={active}
						display='inline-flex'
						flexDirection={hasPreview ? 'column' : 'row'}
						alignItems='center'
						justifyContent='center'
						gap={hasPreview ? '1.5' : '0'}
						{...segPad}
						fontSize={segFontSize}
						fontWeight={active ? '600' : '500'}
						color={active ? 'fg.default' : 'fg.muted'}
						bg={active ? 'bg.surface' : 'transparent'}
						borderRadius='md'
						cursor='pointer'
						transition='background-color .12s ease, color .12s ease, transform .08s ease'
						_hover={active ? undefined : { color: 'fg.default' }}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
						}}
						_active={{ transform: 'scale(0.98)' }}
						boxShadow={active
							? '0 1px 0 color-mix(in srgb, var(--beak-colors-gray-950) 6%, transparent), 0 1px 3px color-mix(in srgb, var(--beak-colors-gray-950) 8%, transparent)'
							: undefined}
						onClick={() => onChange(item.key)}
						onKeyDown={event => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onChange(item.key);
							}
						}}
					>
						{item.preview}
						<Box>{item.label}</Box>
					</Box>
				);
			})}
		</Flex>
	);
}

export default SegmentedControl;
