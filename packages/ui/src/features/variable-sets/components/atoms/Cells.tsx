import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

// All cell wrappers share the className 'beak-vs-cell' so the Structure
// `Header` selector can target descendants of any kind via that class.

const cellBase = {
	className: 'beak-vs-cell',
	borderBottomWidth: '1px',
	borderColor: 'border.subtle',
} as const;

export const Cell: React.FC<BoxProps> = props => <Box {...cellBase} {...props} />;

export const CellAction: React.FC<BoxProps> = props => (
	<Box display='inline-block' px='1' cursor='pointer' {...props} />
);

export const HeaderCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} color='fg.default' borderLeftWidth='1px' borderLeftColor='border.subtle' {...props} />
);

export const HeaderNameCell: React.FC<BoxProps> = props => (
	<Box
		{...cellBase}
		color='fg.default'
		borderLeft='none'
		css={{ '> input': { color: 'var(--beak-colors-fg-default)' } }}
		{...props}
	/>
);

export const HeaderGroupNameCell: React.FC<BoxProps> = props => (
	<Box
		{...cellBase}
		color='fg.default'
		borderLeftWidth='1px'
		borderLeftColor='border.subtle'
		display='flex'
		flexDirection='row'
		{...props}
	/>
);

export const BodyCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} borderLeftWidth='1px' borderLeftColor='border.subtle' {...props} />
);

export const BodyNameCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} display='flex' flexDirection='row' borderLeft='none' {...props} />
);

export const BodyValueCell: React.FC<BoxProps> = props => (
	<Box
		{...cellBase}
		borderLeftWidth='1px'
		borderLeftColor='border.subtle'
		css={{
			'> div > article': {
				width: 'calc(100% - 12px)',
				border: '1px solid transparent',
				borderRadius: '4px',
				background: 'none',
				padding: '3px 6px',
				margin: '0',
				fontSize: '12px',
				color: 'var(--beak-colors-fg-default)',
				transition: 'background-color .12s ease, border-color .12s ease, box-shadow .12s ease',
			},
			'> div > article:hover': {
				background: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 45%, transparent)',
			},
			'> div > article:focus-within': {
				outline: 'none',
				background: 'var(--beak-colors-bg-surface)',
				borderColor: 'var(--beak-colors-accent-pink)',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
			},
		}}
		{...props}
	/>
);
