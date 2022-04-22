import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@beak/app/components/atoms/Button';
import SidebarSectionCard from '@beak/app/features/sidebar/components/SidebarSectionCard';
import { sidebarPreferenceSetSelected } from '@beak/app/store/preferences/actions';
import { createNewVariableGroup } from '@beak/app/store/variable-groups/actions';
import styled from 'styled-components';

const NoVariableGroups: React.FunctionComponent = () => {
	const dispatch = useDispatch();

	function createVariableGroup() {
		dispatch(sidebarPreferenceSetSelected('variables'));
		dispatch(createNewVariableGroup({ }));
	}

	return (
		<Container>
			<SidebarSectionCard>
				<Title>{'You have no variable groups'}</Title>

				<Button size={'sm'} onClick={createVariableGroup}>
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

export default NoVariableGroups;
