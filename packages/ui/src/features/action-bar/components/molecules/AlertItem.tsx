import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';

interface AlertItemProps {
	title: string;
	description: string;
	action?: {
		cta: string;
		callback: () => void;
	};
}

const AlertItem: React.FC<AlertItemProps> = ({ title, description, action }) => (
	<Flex
		align='flex-start'
		gap='2.5'
		px='3'
		py='2.5'
		borderBottomWidth='1px'
		borderColor='border.subtle'
		_last={{ borderBottomWidth: '0' }}
		_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-warning) 6%, transparent)' }}
		transition='background-color .12s ease'
	>
		<Flex
			align='center'
			justify='center'
			flexShrink={0}
			w='24px'
			h='24px'
			borderRadius='md'
			bg='color-mix(in srgb, var(--beak-colors-accent-warning) 18%, transparent)'
			color='accent.warning'
			mt='0.5'
		>
			<AlertTriangle size={12} strokeWidth={2.2} />
		</Flex>
		<Box flex='1 1 auto' minW={0}>
			<Box fontSize='sm' fontWeight='600' color='fg.default' lineHeight='1.3'>{title}</Box>
			<Box fontSize='xs' color='fg.muted' mt='0.5' lineHeight='1.4'>{description}</Box>
		</Box>
		{action && (
			<Flex flexShrink={0} align='center' alignSelf='center'>
				<Button size='sm' onClick={action.callback}>{action.cta}</Button>
			</Flex>
		)}
	</Flex>
);

export default AlertItem;
