import { chakra } from '@chakra-ui/react';

/**
 * Grid columns for the JSON editor:
 *  - 18px gutter for the folder/disclosure chevron
 *  - 28px gutter for the toggle switch
 *  - .9fr key (indent grows inside this cell by depth)
 *  - 56px type chip
 *  - 1fr value
 *  - 56px action stack (add / remove)
 *  - 24px drag handle
 *
 * Every row sits inside this grid so the columns stay flush whether the row
 * is a header label, an object container, or a leaf string/number/etc.
 */
export const Row = chakra('div', {
	base: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: '18px 28px minmax(0, .9fr) 56px minmax(0, 1fr) 56px 24px',
		gridTemplateRows: 'minmax(0, 1fr)',
		alignItems: 'stretch',
		minHeight: '30px',
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
		'&:hover [data-row-drag], &:focus-within [data-row-drag]': { opacity: 1 },
		'&[data-empty="true"]': { minHeight: '26px' },
		'&[data-empty="true"]:hover, &[data-empty="true"]:focus-within': {
			backgroundColor: 'transparent',
		},
		'&[data-empty="true"]::before': { display: 'none' },
		// Drag/drop feedback —
		'&[data-drag-state="dragging"]': { opacity: 0.4 },
		'&[data-drop-state="before"]': {
			boxShadow: 'inset 0 2px 0 var(--beak-colors-accent-pink)',
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
		},
		'&[data-drop-state="after"]': {
			boxShadow: 'inset 0 -2px 0 var(--beak-colors-accent-pink)',
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
		},
		'&[data-drop-state="inside"]': {
			boxShadow: 'inset 0 0 0 2px var(--beak-colors-accent-pink)',
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
		},
	},
});

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
