import { Box, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import Button from '@beak/ui/components/atoms/Button';
import { useAppSelector } from '@beak/ui/store/redux';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { motion } from 'framer-motion';
import { Dices, FileQuestion } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../../store/actions';

const MotionBox = motion.create(Box);

const NotTheTabYourLookingFor: React.FC = () => {
	const tree = useAppSelector(s => s.global.project.tree);
	const dispatch = useDispatch();

	function spinThatWheel() {
		const requests = TypedObject.values(tree).filter(n => n.type === 'request') as ValidRequestNode[];

		if (requests.length === 0) return;

		dispatch(
			changeTab({
				type: 'request',
				payload: requests[Math.floor(Math.random() * requests.length)].id,
				temporary: false,
			}),
		);
	}

	return (
		<Flex h='100%' direction='column' align='center' justify='center' gap='3' bg='bg.canvas' px='6' py='8' textAlign='center'>
			<MotionBox
				initial={{ opacity: 0, scale: 0.92 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: 'spring', stiffness: 600, damping: 28 }}
			>
				<Flex
					align='center'
					justify='center'
					w='56px'
					h='56px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
				>
					<FileQuestion size={26} strokeWidth={1.8} />
				</Flex>
			</MotionBox>
			<Box>
				<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
					{"This isn't the tab you're looking for"}
				</Box>
				<Box fontSize='xs' color='fg.muted' mt='1.5' maxW='320px' mx='auto'>
					{'Pick a request from the sidebar — or feel lucky?'}
				</Box>
			</Box>
			<Button size='sm' onClick={spinThatWheel}>
				<Flex align='center' gap='1.5'>
					<Dices size={12} />
					{'Spin the wheel'}
				</Flex>
			</Button>
		</Flex>
	);
};

export default NotTheTabYourLookingFor;
