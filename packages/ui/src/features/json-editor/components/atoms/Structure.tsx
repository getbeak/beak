import { chakra } from '@chakra-ui/react';

export const Row = chakra('div', {
	base: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: 'minmax(0, .9fr) 56px minmax(0, 1fr) 45px',
		gridTemplateRows: 'minmax(0, 1fr)',
		alignItems: 'stretch',
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		transition: 'background-color .1s ease',
		'&::before': {
			content: '""',
			position: 'absolute',
			top: 0,
			bottom: 0,
			left: 0,
			width: '2px',
			backgroundColor: 'accent.pink',
			opacity: 0,
			transition: 'opacity .12s ease',
			pointerEvents: 'none',
		},
		'&:hover': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 35%, transparent)',
		},
		'&:hover::before, &:focus-within::before': { opacity: 1 },
		'&:focus-within': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 55%, transparent)',
		},
		'&:hover [data-row-action], &:focus-within [data-row-action]': { opacity: 1 },
		'&[data-empty="true"]:hover, &[data-empty="true"]:focus-within': {
			backgroundColor: 'transparent',
		},
		'&[data-empty="true"]::before': { display: 'none' },
	},
});

export const Header = chakra('div', {
	base: {
		position: 'sticky',
		top: 0,
		zIndex: 1,
		backgroundColor: 'bg.surface',
		'& > div': { borderBottomColor: 'border.default' },
	},
});

export const Body = chakra('div', {});
