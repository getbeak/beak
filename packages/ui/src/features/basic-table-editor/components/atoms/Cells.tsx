import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

/**
 * Header cell — caps each column with a small uppercase label that lines up
 * with the leading-edge of the body cell beneath it. The left padding stays
 * in lockstep with the body padding so the columns visibly start at the same
 * pixel even though the body shows inputs and the header shows text.
 */
const headerBase = {
	display: 'flex',
	alignItems: 'center',
	height: '100%',
	px: '2',
	color: 'fg.subtle',
	fontSize: '10px',
	fontWeight: '700',
	letterSpacing: '0.06em',
	textTransform: 'uppercase',
} as const;

export const HeaderCell = chakra('div', { base: headerBase });
// The expand + toggle columns reserve fixed gutters; no label, but kept
// so the grid lines up cleanly between the header and body rows.
export const HeaderExpandCell = chakra('div', { base: { ...headerBase, px: 0 } });
export const HeaderToggleCell = chakra('div', { base: { ...headerBase, px: 0 } });
export const HeaderKeyCell = chakra('div', { base: headerBase });
export const HeaderValueCell = chakra('div', { base: headerBase });
export const HeaderAction = chakra('div', { base: { ...headerBase, px: 0 } });

export const BodyCell = chakra('div', {});

/**
 * Expand column — fixed 22px wide, centred. Hosts the per-row chevron that
 * reveals inline schema authoring (type / required / description / options)
 * under each row.
 */
export const BodyExpandCell = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

/**
 * The toggle column — fixed 28px wide, centred. Mirrors HeaderToggleCell so
 * the column rhythm matches between the header and the body.
 */
export const BodyToggleCell = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

/**
 * Key cell — the input wrapper handles its own padding so the active cell
 * doesn't shift sideways when focus draws the underline. Keep the parent at
 * `display:flex` so the input stretches to fill the column.
 */
export const BodyPrimaryCell = chakra('div', {
	base: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'stretch',
	},
});

/**
 * `BodyInputWrapper` skins the underlying `<article>` / `<input>` so the user
 * sees a single, full-bleed editing surface. No border at rest — the row is
 * the chrome. On focus we drop in a soft pink underline so the active cell
 * is unmistakable but the table outline stays calm.
 */
export const BodyInputWrapper: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		flexGrow={1}
		display='flex'
		alignItems='stretch'
		css={{
			'& > div, & > input[type=text]': {
				width: '100%',
				display: 'flex',
				alignItems: 'center',
			},
			'& > div > article, & > input[type=text]': {
				width: '100%',
				height: '100%',
				minHeight: '30px',
				border: 'none',
				borderRadius: '0',
				background: 'transparent',
				padding: '0 10px',
				margin: '0',
				fontSize: '12px',
				lineHeight: '30px',
				color: 'var(--beak-colors-fg-default)',
				caretColor: 'var(--beak-colors-accent-pink)',
				transition: 'background-color .12s ease, box-shadow .12s ease',
			},
			'& > div > article:hover, & > input[type=text]:hover': {
				background: 'color-mix(in srgb, var(--beak-colors-fg-default) 3%, transparent)',
			},
			'& > div > article:focus-within, & > input[type=text]:focus': {
				outline: 'none',
				background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, transparent)',
				boxShadow: 'inset 0 -1px 0 var(--beak-colors-accent-pink)',
			},
			'& > input:disabled': {
				color: 'inherit',
				userSelect: 'none',
				background: 'transparent',
			},
			'& > input:disabled:hover': {
				background: 'transparent',
			},
		}}
		{...rest}
	>
		{children}
	</Box>
);
export const BodyInputValueCell = chakra('div', {
	base: { display: 'flex', alignItems: 'stretch' },
});
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
