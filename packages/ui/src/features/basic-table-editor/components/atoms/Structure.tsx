import { chakra } from '@chakra-ui/react';

/**
 * Visual columns for the key/value editor:
 *  - 22px gutter for the row-expand chevron (reveals inline schema authoring)
 *  - 28px gutter for the toggle switch (kept flush so toggle aligns column)
 *  - .8fr key
 *  - 1fr value
 *  - 28px gutter for the row-action menu
 *
 * Every cell sits inside this grid so the column rhythm holds whether the row
 * is the header (just labels) or a body row (chevron + toggle + inputs + actions).
 */
export const Row = chakra('div', {
	base: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: '22px 28px minmax(0, .8fr) minmax(0, 1fr) 28px',
		// In valuesOnly the expand chevron is hidden (no schema panel) and
		// the action button is gone (no add/remove), but we don't just
		// collapse those tracks — the freed real estate goes to a new
		// "Description" column so the schema's field doc lives in the
		// table itself rather than behind a hover-only Info icon.
		'&[data-values-only="true"]': {
			gridTemplateColumns: '0px 28px minmax(0, .8fr) minmax(0, 1fr) minmax(0, 1.2fr)',
		},
		gridTemplateRows: 'minmax(0, 1fr)',
		alignItems: 'stretch',
		minHeight: '28px',
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		// Background change is intentionally instant — see Structure.tsx in
		// json-editor for the rationale. tl;dr: tweens flicker under rapid
		// hover/focus-within oscillation when the user clicks between cells.
		'&::before': {
			content: '""',
			position: 'absolute',
			top: 0,
			bottom: 0,
			left: 0,
			width: '2px',
			backgroundColor: 'accent.pink',
			opacity: 0,
			pointerEvents: 'none',
		},
		'&:hover, &:focus-within': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
		},
		'&:hover::before, &:focus-within::before': { opacity: 1 },
		'&:hover [data-row-action], &:focus-within [data-row-action]': { opacity: 1 },
		'&[data-empty="true"]': {
			minHeight: '24px',
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
			minHeight: '22px',
		},
	},
});

export const Body = chakra('div', {});
