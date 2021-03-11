import Button from '@beak/app/components/atoms/Button';
import { insertNewGroup, insertNewVariableGroup } from '@beak/app/store/variable-groups/actions';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

interface CreateNewSplashProps {
	type: 'group' | 'variable-group';
	variableGroup?: string;
}

const CreateNewSplash: React.FunctionComponent<CreateNewSplashProps> = ({ type, variableGroup }) => {
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Header>
				{type === 'group' && 'Looks like you have no groups in here?'}
				{type === 'variable-group' && 'Looks like you have no variable groups?'}
			</Header>
			<Button
				onClick={() => {
					if (type === 'group')
						dispatch(insertNewGroup({ variableGroup: variableGroup!, group: '' }));
					else if (type === 'variable-group')
						dispatch(insertNewVariableGroup(null));
				}}
			>
				{'Let\'s create one!'}
			</Button>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	text-align: center;
`;

const Header = styled.h1`
	display: block;
	text-align: center;
	padding: 10px 25px;
	font-size: 25px;
	font-weight: 400;
	color: ${p => p.theme.ui.textOnFill};
`;

export default CreateNewSplash;
