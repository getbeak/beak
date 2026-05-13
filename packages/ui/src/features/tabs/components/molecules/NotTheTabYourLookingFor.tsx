import { Box, Heading, Text } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import Button from '@beak/ui/components/atoms/Button';
import { useAppSelector } from '@beak/ui/store/redux';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../../store/actions';

const NotTheTabYourLookingFor: React.FC = () => {
	const tree = useAppSelector(s => s.global.project.tree);
	const dispatch = useDispatch();

	function spinThatWheel() {
		const requests = TypedObject.values(tree).filter(n => n.type === 'request') as ValidRequestNode[];

		dispatch(
			changeTab({
				type: 'request',
				payload: requests[Math.floor(Math.random() * requests.length)].id,
				temporary: false,
			}),
		);
	}

	return (
		<Box h='100%' textAlign='center' bg='bg.canvas' px='6' py='5'>
			<Heading as='h1' m='0' fontWeight='400' fontSize='3xl' lineHeight='25px' color='fg.default'>
				{"This is not the tab you're looking for"}
			</Heading>
			<Text fontSize='lg' color='fg.muted'>
				{'Why not select a request to get going, or...'}
			</Text>
			<Button onClick={() => spinThatWheel()}>{'Spin the wheel!'}</Button>
		</Box>
	);
};

export default NotTheTabYourLookingFor;
