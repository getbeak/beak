import { Button, Flex } from '@chakra-ui/react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

import * as React from 'react';

interface ArrowButtonProps {
	direction?: 'left' | 'right';
	onClick: () => void;
}

const ArrowButton: React.FC<React.PropsWithChildren<ArrowButtonProps>> = ({
	direction = 'left',
	children,
	onClick,
}) => (
	<Button
		variant='ghost'
		size='sm'
		bg='transparent'
		border='none'
		color='fg.default'
		px='1.5'
		py='1'
		borderRadius='sm'
		fontSize='lg'
		cursor='pointer'
		_hover={{ bg: 'accent.pink.muted' }}
		onClick={onClick}
	>
		{direction === 'left' && (
			<ChevronsLeft color='var(--beak-colors-fg-default)' size={12} />
		)}
		<Flex display='inline-flex' mx='1.5'>
			{children}
		</Flex>
		{direction === 'right' && (
			<ChevronsRight color='var(--beak-colors-fg-default)' />
		)}
	</Button>
);

export default ArrowButton;
