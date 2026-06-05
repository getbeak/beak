import { Button, type ButtonProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * The pill icon-bearing button used throughout the action bar
 * (encryption toggle, flight history controls, omni-search).
 *
 * Refs are forwarded so anchored popovers can read the button's
 * bounding box.
 */
const ActionBarButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, ...rest }, ref) => (
	<Button
		ref={ref}
		variant='ghost'
		size='xs'
		px='1.5'
		h='26px'
		w='26px'
		minW='26px'
		borderRadius='md'
		bg='transparent'
		color='fg.subtle'
		pointerEvents='auto'
		transition='color .14s ease, background-color .14s ease, transform .08s ease, box-shadow .14s ease'
		_hover={{
			color: 'accent.pink',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
		}}
		_active={{ transform: 'scale(0.92)' }}
		_disabled={{
			opacity: 0.35,
			cursor: 'default',
			_hover: { bg: 'transparent', color: 'fg.subtle' },
		}}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
		}}
		{...rest}
	>
		{children}
	</Button>
));

ActionBarButton.displayName = 'ActionBarButton';

export default ActionBarButton;
