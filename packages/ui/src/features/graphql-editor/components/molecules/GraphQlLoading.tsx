import { Box, Flex } from '@chakra-ui/react';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
		<FontAwesomeIcon icon={faSpinner} opacity={0.4} spin size='4x' />
		<Box fontSize='xl' my='2.5' fontWeight='300' color='fg.default'>
			{'Fetching GraphQL schema'}
		</Box>
	</Flex>
);

export default GraphQlLoading;
