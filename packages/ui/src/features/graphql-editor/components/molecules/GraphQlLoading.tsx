import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';
import * as React from 'react';

const MotionBox = motion.create(Box);

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
		justify='center'
		gap='3'
	>
		<Box position='relative' w='56px' h='56px'>
			<MotionBox
				position='absolute'
				inset='0'
				borderRadius='full'
				border='1.5px solid'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)'
				borderTopColor='transparent'
				animate={{ rotate: 360 }}
				transition={{ duration: 0.95, ease: 'linear', repeat: Infinity }}
			/>
			<Flex
				position='absolute'
				inset='8px'
				align='center'
				justify='center'
				borderRadius='full'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				color='accent.pink'
				boxShadow='inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
			>
				<Hash size={18} strokeWidth={2.2} />
			</Flex>
		</Box>
		<Flex direction='column' gap='1'>
			<Box fontSize='md' fontWeight='600' color='fg.default'>
				{'Fetching GraphQL schema'}
			</Box>
			<Box fontSize='10px' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase' fontWeight='700'>
				{'Introspecting endpoint…'}
			</Box>
		</Flex>
	</Flex>
);

export default GraphQlLoading;
