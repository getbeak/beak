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
		px='2'
		h='25px'
		minW='auto'
		borderRadius='sm'
		bg='transparent'
		color='fg.muted'
		pointerEvents='auto'
		_hover={{ bg: 'bg.surface' }}
		_disabled={{ opacity: 0.5, cursor: 'default', _hover: { bg: 'transparent' } }}
		_focusVisible={{ outline: '1px solid', outlineColor: 'accent.pink', outlineOffset: '1px' }}
		{...rest}
	>
		{children}
	</Button>
));

ActionBarButton.displayName = 'ActionBarButton';

export default ActionBarButton;
