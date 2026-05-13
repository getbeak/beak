import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

const headerBase = {
	py: '1',
	px: '1.5',
	color: 'fg.subtle',
	fontSize: '10px',
	fontWeight: '600',
	letterSpacing: '0.06em',
	textTransform: 'uppercase',
} as const;

export const HeaderCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderKeyCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderTypeCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderValueCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderAction: React.FC<BoxProps> = props => <Box {...headerBase} px={0} {...props} />;

export const BodyCell: React.FC<BoxProps> = props => <Box {...props} />;

interface BodyPrimaryCellProps extends BoxProps {
	depth: number;
}

export const BodyPrimaryCell: React.FC<BodyPrimaryCellProps> = ({ depth, ...rest }) => (
	<Box
		display='flex'
		flexDirection='row'
		alignItems='center'
		style={{ paddingLeft: `${depth * 10 + 4}px` }}
		gap='4px'
		{...rest}
	/>
);

export const BodyInputWrapper: React.FC<BoxProps> = props => (
	<Box
		flexGrow={1}
		css={{
			'> div > article, > input[type=text]': {
				width: '100%',
				height: '24px',
				border: '1px solid transparent',
				borderRadius: '4px',
				background: 'transparent',
				padding: '2px 6px',
				margin: '0',
				fontSize: '12px',
				color: 'var(--beak-colors-fg-default)',
				transition: 'background-color .1s ease, border-color .1s ease',
			},
			'> div > article:hover, > input[type=text]:hover': {
				background: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 50%, transparent)',
			},
			'> div > article:focus-within, > input[type=text]:focus': {
				outline: 'none',
				background: 'var(--beak-colors-bg-surface)',
				borderColor: 'var(--beak-colors-accent-pink)',
			},
			'> input:disabled': {
				color: 'inherit',
				userSelect: 'none',
				background: 'transparent',
			},
		}}
		{...props}
	/>
);

export const BodyNullWrapper: React.FC<BoxProps> = props => (
	<Box pl='1.5' lineHeight='24px' color='fg.subtle' fontStyle='italic' {...props} />
);
export const BodyNameOverrideWrapper: React.FC<BoxProps> = props => (
	<Box pl='1.5' lineHeight='24px' {...props} />
);
export const BodyTypeCell: React.FC<BoxProps> = props => <Box display='flex' alignItems='center' {...props} />;
export const BodyInputValueCell: React.FC<BoxProps> = props => <Box {...props} />;
export const BodyLabelValueCell: React.FC<BoxProps> = props => (
	<Box pt='0.5' pl='1.5' {...props} />
);

const BodyActionBase = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		opacity: 0,
		transition: 'opacity .12s ease',
		'&:hover': { opacity: 1 },
	},
});

export const BodyAction: React.FC<BoxProps> = props => <BodyActionBase data-row-action='' {...props} />;
