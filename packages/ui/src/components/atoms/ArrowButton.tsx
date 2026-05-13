import { Button, Flex } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
		size='xs'
		bg='transparent'
		border='none'
		color='fg.muted'
		px='1.5'
		py='1'
		h='auto'
		minH='22px'
		borderRadius='sm'
		fontSize='xs'
		fontWeight='500'
		cursor='pointer'
		transition='color .12s ease, background-color .12s ease, transform .08s ease'
		_hover={{
			color: 'fg.default',
			bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 60%, transparent)',
		}}
		_active={{ transform: 'scale(0.96)' }}
		onClick={onClick}
	>
		<Flex align='center' gap='1'>
			{direction === 'left' && <ChevronLeft size={12} />}
			<Flex display='inline-flex'>{children}</Flex>
			{direction === 'right' && <ChevronRight size={12} />}
		</Flex>
	</Button>
);

export default ArrowButton;
