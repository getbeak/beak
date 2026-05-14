import { chakra } from '@chakra-ui/react';

/**
 * Visual columns for the key/value editor:
 *  - 28px gutter for the toggle switch (kept flush so toggle aligns column)
 *  - .8fr key
 *  - 1fr value
 *  - 28px gutter for the row-action menu
 *
 * Every cell sits inside this grid so the column rhythm holds whether the row
 * is the header (just labels) or a body row (toggle + inputs + actions).
 */
export const Row = chakra('div', {
	base: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: '28px minmax(0, .8fr) minmax(0, 1fr) 28px',
		gridTemplateRows: 'minmax(0, 1fr)',
		alignItems: 'stretch',
		minHeight: '32px',
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		transition: 'background-color .12s ease',
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
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 4%, transparent)',
		},
		'&:focus-within': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
		},
		'&:hover::before, &:focus-within::before': { opacity: 1 },
		'&:hover [data-row-action], &:focus-within [data-row-action]': { opacity: 1 },
		'&[data-empty="true"]': {
			minHeight: '28px',
		},
		'&[data-empty="true"]:hover, &[data-empty="true"]:focus-within': {
			backgroundColor: 'transparent',
		},
		'&[data-empty="true"]::before': { display: 'none' },
	},
});

/**
 * Sticky column-header band. Sits flush against the top of the body so the
 * KEY / VALUE labels read as the column starts, not as a floating banner.
 */
export const Header = chakra('div', {
	base: {
		position: 'sticky',
		top: 0,
		zIndex: 1,
		backgroundColor: 'bg.surface',
		'& > div': {
			borderBottomColor: 'border.default',
			minHeight: '26px',
		},
	},
});

export const Body = chakra('div', {});
