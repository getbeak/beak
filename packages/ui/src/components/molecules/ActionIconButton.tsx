import { Button, type ButtonProps } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

interface ActionIconButtonProps extends Omit<ButtonProps, 'children'> {
	icon: LucideIcon;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ icon: Icon, ...buttonProps }) => (
	<Button
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		w='16px'
		h='16px'
		minW='16px'
		p='0'
		mr='1.5'
		bg='transparent'
		borderWidth='1px'
		borderColor='border.default'
		color='fg.subtle'
		borderRadius='full'
		transition='border-color .12s ease, color .12s ease, background-color .12s ease, transform .08s ease'
		_hover={{
			color: 'accent.pink',
			borderColor: 'accent.pink',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
		}}
		_active={{ transform: 'scale(0.92)' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
		}}
		{...buttonProps}
	>
		<Icon size={9} strokeWidth={2.4} />
	</Button>
);

export default ActionIconButton;
