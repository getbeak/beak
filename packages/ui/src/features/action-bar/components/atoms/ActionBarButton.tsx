import { Button, type ButtonProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * The pill icon-bearing button used throughout the action bar
 * (encryption toggle, flight history controls, omni-search, alerts).
 *
 * Maps to Chakra's `<Button>` with the ghost-style hover treatment the
 * previous styled-components version had. Renders as a `<button>` and
 * accepts the same prop surface (id, onClick, disabled, data-* attrs).
 *
 * Refs are forwarded so anchored popovers (e.g. AlertsPopover) can read
 * the underlying button's bounding box.
 */
const ActionBarButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, ...rest }, ref) => (
	<Button
		ref={ref}
		variant='ghost'
		size='xs'
		px='1.5'
		h='28px'
		w='28px'
		minW='28px'
		borderRadius='md'
		bg='transparent'
		color='fg.muted'
		pointerEvents='auto'
		transition='color .14s ease, background-color .14s ease, transform .08s ease'
		_hover={{
			color: 'fg.default',
			bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)',
		}}
		_active={{ transform: 'scale(0.92)' }}
		_disabled={{
			opacity: 0.35,
			cursor: 'default',
			_hover: { bg: 'transparent', color: 'fg.muted' },
		}}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)',
		}}
		{...rest}
	>
		{children}
	</Button>
));

ActionBarButton.displayName = 'ActionBarButton';

export default ActionBarButton;
