import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

type Indicator = 'pink' | 'teal' | 'indigo' | 'alert' | 'success' | 'warning' | 'info';

interface RowProps {
	label: React.ReactNode;
	description?: React.ReactNode;
	indicator?: Indicator;
	align?: 'center' | 'start';
	children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, description, indicator, align = 'center', children }) => (
	<Flex
		align={align === 'center' ? 'center' : 'flex-start'}
		gap='4'
		px='5'
		py='3'
		borderBottomWidth='1px'
		borderBottomStyle='solid'
		borderBottomColor='border.subtle'
		css={{ '&:last-of-type': { borderBottomWidth: 0 } }}
	>
		{indicator && (
			<Box
				flex='0 0 auto'
				w='6px'
				h='6px'
				borderRadius='9999px'
				bg={`accent.${indicator}`}
				boxShadow={`0 0 6px color-mix(in srgb, var(--beak-colors-accent-${indicator}) 55%, transparent)`}
				mt={align === 'start' ? '2' : 0}
			/>
		)}
		<Box flex='1 1 auto' minW={0}>
			<Box fontSize='sm' fontWeight='500' color='fg.default' letterSpacing='-0.005em'>
				{label}
			</Box>
			{description && (
				<Box fontSize='xs' color='fg.subtle' mt='0.5' lineHeight='1.45'>
					{description}
				</Box>
			)}
		</Box>
		{children !== undefined && (
			<Box flex='0 0 auto' minW={0}>
				{children}
			</Box>
		)}
	</Flex>
);

export default Row;
