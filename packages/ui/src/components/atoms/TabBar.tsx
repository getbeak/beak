import { Flex, type FlexProps } from '@chakra-ui/react';
import * as React from 'react';

export interface TabBarProps extends Omit<FlexProps, 'justify'> {
	$centered?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ $centered, children, ...rest }) => (
	<Flex
		direction='row'
		align='flex-end'
		justify={$centered ? 'center' : 'initial'}
		overflowX='auto'
		minW='100%'
		css={{
			'&::-webkit-scrollbar': { height: 0, transition: 'height .1s ease' },
			'&:hover::-webkit-scrollbar': { height: '3px' },
		}}
		{...rest}
	>
		{children}
	</Flex>
);

export default TabBar;
