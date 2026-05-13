import { Box } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import SidebarSectionCard from '@beak/ui/features/sidebar/components/SidebarSectionCard';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { createNewVariableSet } from '@beak/ui/store/variable-sets/actions';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const NoVariableSets: React.FC = () => {
	const dispatch = useDispatch();

	function createVariableSet() {
		dispatch(sidebarPreferenceSetSelected('variables'));
		dispatch(createNewVariableSet({}));
	}

	return (
		<Box mb='2.5'>
			<SidebarSectionCard>
				<Box mb='1'>{'You have no variable sets'}</Box>
				<Button size='sm' onClick={createVariableSet}>
					{'Make one'}
				</Button>
			</SidebarSectionCard>
		</Box>
	);
};

export default NoVariableSets;
