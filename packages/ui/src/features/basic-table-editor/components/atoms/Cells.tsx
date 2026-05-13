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

export const HeaderCell = chakra('div', { base: headerBase });
export const HeaderKeyCell = chakra('div', { base: headerBase });
export const HeaderValueCell = chakra('div', { base: headerBase });
export const HeaderAction = chakra('div', { base: { ...headerBase, px: 0 } });

export const BodyCell = chakra('div', {});
export const BodyPrimaryCell = chakra('div', {
	base: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: '2px',
		gap: '6px',
	},
});

export const BodyInputWrapper: React.FC<BoxProps> = ({ children, ...rest }) => (
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
				caretColor: 'var(--beak-colors-accent-pink)',
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
			'> input:disabled:hover': {
				background: 'transparent',
			},
		}}
		{...rest}
	>
		{children}
	</Box>
);
export const BodyInputValueCell = chakra('div', {});
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
