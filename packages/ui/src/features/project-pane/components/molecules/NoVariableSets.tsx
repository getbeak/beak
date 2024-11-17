import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@beak/ui/components/atoms/Button';
import SidebarSectionCard from '@beak/ui/features/sidebar/components/SidebarSectionCard';
import { sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { createNewVariableSet } from '@beak/ui/store/variable-sets/actions';
import styled from 'styled-components';

const NoVariableSets: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	function createVariableSet() {
		dispatch(sidebarPreferenceSetSelected('variables'));
		dispatch(createNewVariableSet({ }));
	}

	return (
		<Container>
			<SidebarSectionCard>
				<Title>{'You have no variable sets'}</Title>

				<Button size={'sm'} onClick={createVariableSet}>
					{'Make one'}
				</Button>
			</SidebarSectionCard>
		</Container>
	);
};

const Container = styled.div`
	margin-bottom: 10px;
`;

const Title = styled.div`
	margin-bottom: 5px;
`;

export default NoVariableSets;
