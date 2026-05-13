import { Box, Flex } from '@chakra-ui/react';
import { Loader2 } from 'lucide-react';

import * as React from 'react';

const GraphQlLoading: React.FC = () => (
	<Flex
		direction='column'
		textAlign='center'
		px='10'
		py='12'
		h='calc(100% - 120px)'
		maxW='600px'
		mx='auto'
		align='center'
		css={{ 'svg > path': { fill: 'var(--beak-colors-fg-muted)' } }}
	>
		<Loader2 opacity={0.4} style={{ animation: 'spin 1s linear infinite' }} />
		<Box fontSize='xl' my='2.5' fontWeight='300' color='fg.default'>
			{'Fetching GraphQL schema'}
		</Box>
	</Flex>
);

export default GraphQlLoading;
