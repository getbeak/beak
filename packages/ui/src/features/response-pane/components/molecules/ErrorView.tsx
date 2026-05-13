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
			style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}
		>
			<Flex
				justify='center'
				align='center'
				mx='auto'
				w='52px'
				h='52px'
				borderRadius='full'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
				color='accent.alert'
				mb='3'
				boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-alert) 24%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
			>
				<CloudLightning size={24} strokeWidth={1.8} />
			</Flex>
			<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
				{'Request failed'}
			</Box>
			<Box fontSize='xs' color='fg.subtle' mt='1' mb='3'>
				{"The network call didn't complete. Check the message below for details."}
			</Box>
			<Box
				display='inline-block'
				textAlign='left'
				w='100%'
				maxW='400px'
				p='2.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 32%, var(--beak-colors-border-subtle))'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
			>
				<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.alert' mb='1'>
					{'Error message'}
				</Box>
				<Box fontSize='xs' color='fg.default' overflowWrap='anywhere' fontFamily='mono' lineHeight='1.45'>
					{error.message}
				</Box>
			</Box>
		</motion.div>
	</Flex>
);

export default ErrorView;
