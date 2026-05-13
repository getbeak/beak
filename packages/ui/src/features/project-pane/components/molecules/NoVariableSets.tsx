import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { createNewVariableSet } from '@beak/ui/store/variable-sets/actions';
import { Plus, Table } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const NoVariableSets: React.FC = () => {
	const dispatch = useDispatch();

	function createVariableSet() {
		dispatch(sidebarPreferenceSetSelected('variables'));
		dispatch(createNewVariableSet({}));
	}

	return (
		<Box mb='2'>
			<Flex
				direction='column'
				align='flex-start'
				gap='2'
				px='2.5'
				py='2'
				borderRadius='md'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
			>
				<Flex align='center' gap='1.5' color='accent.teal'>
					<Table size={11} strokeWidth={2.2} />
					<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
						{'No variable sets yet'}
					</Box>
				</Flex>
				<Button size='sm' colour='secondary' onClick={createVariableSet}>
					<Flex align='center' gap='1'>
						<Plus size={11} />
						{'Create one'}
					</Flex>
				</Button>
			</Flex>
		</Box>
	);
};

export default NoVariableSets;
