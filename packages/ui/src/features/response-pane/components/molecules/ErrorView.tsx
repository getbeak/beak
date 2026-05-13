import { Box, Flex } from '@chakra-ui/react';
import { CloudLightning } from 'lucide-react';
import * as React from 'react';

interface ErrorViewProps {
	error: Error;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error }) => (
	<Flex textAlign='center' px='10' py='5' h='calc(100% - 40px)' align='center'>
		<Box flex='1' css={{ '> svg > path': { fill: 'var(--beak-colors-fg-muted)' } }}>
			<CloudLightning opacity={0.4} />
			<Box fontSize='2xl' my='2.5' fontWeight='300' color='fg.default'>
				{'There was an error executing this request'}
			</Box>
			<Box fontSize='md' color='fg.muted' overflowWrap='anywhere'>
				{error.message}
			</Box>
		</Box>
	</Flex>
);

export default ErrorView;
