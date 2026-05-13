import { Box, Flex, Grid } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
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
	<Grid
		templateColumns='auto min-content'
		templateRows='auto auto'
		px='3'
		py='2'
		borderBottomWidth='1px'
		borderColor='border.default'
		_last={{ borderBottomWidth: '0' }}
	>
		<Box gridRow={1} gridColumn={1} fontSize='lg'>{title}</Box>
		<Box gridRow={2} gridColumn={1} fontSize='sm' color='fg.subtle'>{description}</Box>
		{action && (
			<Flex gridColumn={2} gridRow='1 / 3' align='center'>
				<Button size='sm' onClick={action.callback}>{action.cta}</Button>
			</Flex>
		)}
	</Grid>
);

export default AlertItem;
