import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import SidebarSectionCard from '@beak/ui/features/sidebar/components/SidebarSectionCard';
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
			<SidebarSectionCard>
				<Flex direction='column' align='flex-start' gap='1.5'>
					<Flex align='center' gap='1.5' color='fg.subtle'>
						<Table size={11} />
						<Box fontSize='11px'>{'No variable sets yet'}</Box>
					</Flex>
					<Button size='sm' colour='secondary' onClick={createVariableSet}>
						<Flex align='center' gap='1'>
							<Plus size={11} />
							{'Create one'}
						</Flex>
					</Button>
				</Flex>
			</SidebarSectionCard>
		</Box>
	);
};

export default NoVariableSets;
