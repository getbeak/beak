import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

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

export const HeaderCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
// Folder / disclosure column — no header label, but reserve the gutter so
// the grid lines up between the header and body rows.
export const HeaderFolderCell: React.FC<BoxProps> = props => <Box {...headerBase} px={0} {...props} />;
// Toggle column — same reasoning as the folder gutter.
export const HeaderToggleCell: React.FC<BoxProps> = props => <Box {...headerBase} px={0} {...props} />;
export const HeaderKeyCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderTypeCell: React.FC<BoxProps> = props => (
	<Box {...headerBase} px='0' justifyContent='center' textAlign='center' {...props} />
);
export const HeaderValueCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderAction: React.FC<BoxProps> = props => <Box {...headerBase} px={0} {...props} />;
export const HeaderDragCell: React.FC<BoxProps> = props => <Box {...headerBase} px={0} {...props} />;

export const BodyCell: React.FC<BoxProps> = props => <Box {...props} />;

/**
 * Folder column — the disclosure chevron for object/array entries. Always
 * 18px wide so the indent rhythm matches the grid template column above.
 */
export const BodyFolderCell: React.FC<BoxProps> = props => (
	<Box display='flex' alignItems='center' justifyContent='center' {...props} />
);

/**
 * Toggle column — same 28px gutter as the key/value editor, centred.
 */
export const BodyToggleCell: React.FC<BoxProps> = props => (
	<Box display='flex' alignItems='center' justifyContent='center' {...props} />
);

interface BodyPrimaryCellProps extends BoxProps {
	depth: number;
}

/**
 * Key cell — the only place where depth shows. We indent the *contents* of
 * the cell so the cell itself stays flush with the column edge (the row's
 * pink stripe and the left grid line still hit the same x).
 */
export const BodyPrimaryCell: React.FC<BodyPrimaryCellProps> = ({ depth, ...rest }) => (
	<Box display='flex' flexDirection='row' alignItems='stretch' style={{ paddingLeft: `${depth * 12}px` }} {...rest} />
);

/**
 * Input chrome inside the JSON editor — same idea as the key/value editor:
 * no border at rest, a soft pink fill + underline on focus, and a hover tint
 * so the user can see what's interactive without painting in every row.
 */
export const BodyInputWrapper: React.FC<BoxProps> = props => (
	<Box
		flexGrow={1}
		display='flex'
		alignItems='stretch'
		css={{
			// Scope the "stretch to fill" rule to ONLY the DebouncedInput's
			// wrapper div (the one carrying an `<article>` contentEditable) —
			// without `:has(> article)` the rule used to catch every sibling
			// div, including the 5×5 `RequiredDot` and similar inline
			// indicators, blowing them out to a full-row pink bar. The
			// indicators sit alongside the input as their own children so the
			// flex parent lays them out naturally.
			'& > div:has(> article), & > input[type=text]': {
				width: '100%',
				display: 'flex',
				alignItems: 'center',
			},
			'& > div > article, & > input[type=text]': {
				width: '100%',
				height: '100%',
				minHeight: '24px',
				border: 'none',
				borderRadius: '0',
				background: 'transparent',
				padding: '0 6px',
				margin: '0',
				fontSize: '12px',
				lineHeight: '24px',
				color: 'var(--beak-colors-fg-default)',
				caretColor: 'var(--beak-colors-accent-pink)',
			},
			// Drop the hover bg on inputs — the row's hover/focus-within tint
			// already signals "this row is live"; layering a second tint on the
			// input on top of it produced a perceptible flicker as the user
			// moved the cursor between cells.
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
		}}
		{...props}
	/>
);

export const BodyNullWrapper: React.FC<BoxProps> = props => (
	<Box
		display='flex'
		alignItems='center'
		pl='2'
		fontFamily='mono'
		fontSize='12px'
		color='fg.subtle'
		fontStyle='italic'
		{...props}
	/>
);
export const BodyNameOverrideWrapper: React.FC<BoxProps> = props => (
	<Box display='flex' alignItems='center' pl='2' fontSize='12px' color='fg.muted' {...props} />
);
export const BodyTypeCell: React.FC<BoxProps> = props => (
	<Box display='flex' alignItems='stretch' justifyContent='stretch' {...props} />
);
export const BodyInputValueCell: React.FC<BoxProps> = props => <Box display='flex' alignItems='stretch' {...props} />;
export const BodyLabelValueCell: React.FC<BoxProps> = props => (
	<Box
		display='flex'
		alignItems='center'
		pl='2'
		fontSize='10px'
		fontWeight='700'
		letterSpacing='0.06em'
		textTransform='uppercase'
		color='fg.subtle'
		{...props}
	/>
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
