import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { CloudLightning } from 'lucide-react';
import * as React from 'react';

interface ErrorViewProps {
	error: Error;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error }) => (
	<Flex textAlign='center' px='10' py='5' h='calc(100% - 40px)' align='center' justify='center'>
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: 'easeOut' }}
			style={{ textAlign: 'center', maxWidth: 380 }}
		>
			<Flex justify='center' color='accent.alert' opacity={0.85}>
				<CloudLightning size={32} />
			</Flex>
			<Box fontSize='md' fontWeight='600' mt='2' color='fg.default'>
				{'Request failed'}
			</Box>
			<Box fontSize='xs' color='fg.muted' mt='1' overflowWrap='anywhere' fontFamily='mono'>
				{error.message}
			</Box>
		</motion.div>
	</Flex>
);

export default ErrorView;
