import { Button, type ButtonProps } from '@chakra-ui/react';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

interface ActionIconButtonProps extends Omit<ButtonProps, 'children'> {
	icon: IconProp;
}

const ActionIconButton: React.FC<ActionIconButtonProps> = ({ icon, ...buttonProps }) => (
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
		<FontAwesomeIcon icon={icon} />
	</Button>
);

export default ActionIconButton;
