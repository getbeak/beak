import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@beak/app/components/atoms/Button';
import { insertNewGroup } from '@beak/app/store/variable-groups/actions';
import styled from 'styled-components';

interface CreateNewSplashProps {
	type: 'group';
	variableGroup: string;
}

const CreateNewSplash: React.FC<CreateNewSplashProps> = ({ type, variableGroup }) => {
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Header>
				{'Looks like you have no groups in here?'}
			</Header>
			<Button
				onClick={() => {
					if (type === 'group')
						dispatch(insertNewGroup({ id: variableGroup!, groupName: '' }));
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
