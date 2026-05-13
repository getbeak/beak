import { chakra } from '@chakra-ui/react';

export const Row = chakra('div', {
	base: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1fr) 25px',
		gridTemplateRows: 'minmax(0, 1fr)',
		borderBottomWidth: '1px',
		borderColor: 'border.default',
	},
});

/**
 * The previous styled-components version added `margin-top: 7px` to the
 * first child Row inside a Header via `> ${Row}`. We replicate that
 * via the `& > *:first-of-type` descendant selector since the chakra
 * factory no longer has a direct reference to the Row class.
 */
export const Header = chakra('div', {
	base: {
		'& > div:first-of-type': { mt: '7px' },
	},
});

export const Body = chakra('div', {});
