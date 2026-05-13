import { Button, type ButtonProps } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

interface ActionIconButtonProps extends Omit<ButtonProps, 'children'> {
	icon: LucideIcon;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ icon: Icon, ...buttonProps }) => (
	<Button
		w='15px'
		h='15px'
		minW='15px'
		textAlign='center'
		mr='1.5'
		p='0'
		bg='transparent'
		borderWidth='1px'
		borderColor='fg.muted'
		color='fg.muted'
		borderRadius='full'
		lineHeight='15px'
		boxShadow='0 0 1px 0px white inset, 0 0 1px 0px white'
		fontSize='8px'
		{...buttonProps}
	>
		<Icon size={8} />
	</Button>
);

export default ActionIconButton;
