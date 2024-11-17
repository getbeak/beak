import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@beak/ui/components/atoms/Button';
import { insertNewGroup } from '@beak/ui/store/variable-sets/actions';
import styled from 'styled-components';

interface CreateNewSplashProps {
	type: 'set';
	variableSet: string;
}

const CreateNewSplash: React.FC<CreateNewSplashProps> = ({ type, variableSet }) => {
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Header>
				{'Looks like you have no sets in here?'}
			</Header>
			<Button
				onClick={() => {
					if (type === 'set')
						dispatch(insertNewGroup({ id: variableSet!, setName: '' }));
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
