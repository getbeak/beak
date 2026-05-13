import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

// All cell wrappers share the className 'beak-vs-cell' so the Structure
// `Header` selector can target descendants of any kind via that class.

const cellBase = {
	className: 'beak-vs-cell',
	borderBottomWidth: '1px',
	borderColor: 'border.default',
} as const;

export const Cell: React.FC<BoxProps> = props => <Box {...cellBase} {...props} />;

export const CellAction: React.FC<BoxProps> = props => (
	<Box display='inline-block' px='1' cursor='pointer' {...props} />
);

export const HeaderCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} color='fg.default' borderLeftWidth='1px' borderLeftColor='border.default' {...props} />
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
		borderLeftColor='border.default'
		display='flex'
		flexDirection='row'
		{...props}
	/>
);

export const BodyCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} borderLeftWidth='1px' borderLeftColor='border.default' {...props} />
);

export const BodyNameCell: React.FC<BoxProps> = props => (
	<Box {...cellBase} display='flex' flexDirection='row' borderLeft='none' {...props} />
);

export const BodyValueCell: React.FC<BoxProps> = props => (
	<Box
		{...cellBase}
		borderLeftWidth='1px'
		borderLeftColor='border.default'
		css={{
			'> div > article': {
				width: 'calc(100% - 12px)',
				border: '1px solid transparent',
				background: 'none',
				padding: '3px 5px',
				margin: '0',
				fontSize: '12px',
				color: 'var(--beak-colors-fg-muted)',
			},
		}}
		{...props}
	/>
);
