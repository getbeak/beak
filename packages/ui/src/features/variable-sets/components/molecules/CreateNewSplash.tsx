import { Box, Heading } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { insertNewGroup } from '@beak/ui/store/variable-sets/actions';
import * as React from 'react';
import { useDispatch } from 'react-redux';

interface CreateNewSplashProps {
	type: 'set';
	variableSet: string;
}

const CreateNewSplash: React.FC<CreateNewSplashProps> = ({ type, variableSet }) => {
	const dispatch = useDispatch();

	return (
		<Box textAlign='center'>
			<Heading
				as='h1'
				display='block'
				textAlign='center'
				py='2.5'
				px='6'
				fontSize='2xl'
				fontWeight='400'
				color='fg.muted'
			>
				{'Looks like you have no sets in here?'}
			</Heading>
			<Button
				onClick={() => {
					if (type === 'set') dispatch(insertNewGroup({ id: variableSet, setName: '' }));
				}}
			>
				{"Let's create one!"}
			</Button>
		</Box>
	);
};

export default CreateNewSplash;
