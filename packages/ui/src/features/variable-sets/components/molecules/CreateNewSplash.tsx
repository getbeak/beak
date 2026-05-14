import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { insertNewGroup } from '@beak/ui/store/variable-sets/actions';
import { motion } from 'framer-motion';
import { Plus, Table } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

interface CreateNewSplashProps {
	type: 'set';
	variableSet: string;
}

const CreateNewSplash: React.FC<CreateNewSplashProps> = ({ type, variableSet }) => {
	const dispatch = useDispatch();

	return (
		<Flex direction='column' align='center' justify='center' gap='3' py='12' px='6'>
			<motion.div
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
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
					color='accent.pink'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
					boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
				>
					<Table size={24} strokeWidth={1.8} />
				</Flex>
			</motion.div>
			<Box fontSize='xl' fontWeight='700' color='fg.default' letterSpacing='-0.02em' lineHeight='1.1'>
				{'No sets yet'}
			</Box>
			<Box fontSize='xs' color='fg.muted' textAlign='center' maxW='320px' lineHeight='1.5'>
				{'Variable sets let you switch the same variable between values for different environments (eg. dev / prod).'}
			</Box>
			<Button
				size='sm'
				onClick={() => {
					if (type === 'set') dispatch(insertNewGroup({ id: variableSet, setName: '' }));
				}}
			>
				<Flex align='center' gap='1.5'>
					<Plus size={12} />
					{'Create your first set'}
				</Flex>
			</Button>
		</Flex>
	);
};

export default CreateNewSplash;
