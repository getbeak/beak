import { Flex } from '@chakra-ui/react';
import * as React from 'react';

import { FakeWindow } from '../components/atoms/FakeWindow';
import Welcome from './Welcome';

const WebWelcome: React.FC = () => (
	<Flex
		align='center'
		justify='center'
		h='100vh'
		w='100vw'
		bgImage="url('images/backgrounds/temp.jpg')"
		bgRepeat='no-repeat'
		bgSize='cover'
	>
		<FakeWindow $height={500} $width={900}>
			<Welcome />
		</FakeWindow>
	</Flex>
);

export default WebWelcome;
