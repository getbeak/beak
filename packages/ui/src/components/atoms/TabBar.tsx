import { Flex, type FlexProps } from '@chakra-ui/react';
import { LayoutGroup } from 'framer-motion';
import * as React from 'react';
import { useId } from 'react';

export interface TabBarProps extends Omit<FlexProps, 'justify'> {
	$centered?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ $centered, children, ...rest }) => {
	const layoutId = useId();

	return (
		<LayoutGroup id={layoutId}>
			<Flex
				role='tablist'
				direction='row'
				align='flex-end'
				justify={$centered ? 'center' : 'initial'}
				overflowX='auto'
				overflowY='hidden'
				minW='100%'
				css={{
					'&::-webkit-scrollbar': { height: 0, transition: 'height .1s ease' },
					'&:hover::-webkit-scrollbar': { height: '3px' },
				}}
				{...rest}
			>
				{children}
			</Flex>
		</LayoutGroup>
	);
};

export default TabBar;
