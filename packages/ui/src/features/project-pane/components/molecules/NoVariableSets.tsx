import Button from '@beak/ui/components/atoms/Button';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { createNewVariableSet } from '@beak/ui/store/variable-sets/actions';
import { Box, Flex } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const NoVariableSets: React.FC = () => {
	const dispatch = useDispatch();

	function createVariableSet() {
		dispatch(sidebarPreferenceSetSelected('variables'));
		dispatch(createNewVariableSet({}));
	}

	return (
		<Flex align='center' justify='space-between' gap='2' py='1' minW={0}>
			<Box flex='1 1 auto' minW={0} fontSize='xs' color='fg.subtle' lineHeight='1.4'>
				{'No variable sets'}
			</Box>
			<Button size='sm' colour='secondary' onClick={createVariableSet}>
				<Flex align='center' gap='1'>
					<Plus size={11} />
					{'New'}
				</Flex>
			</Button>
		</Flex>
	);
};

export default NoVariableSets;
