import { Flex } from '@chakra-ui/react';
import * as React from 'react';

import ProjectMain from './ProjectMain';

const WebProjectMain: React.FC = () => (
	<Flex
		align='center'
		justify='center'
		h='100vh'
		w='100vw'
		bgImage="url('images/backgrounds/temp.jpg')"
		bgRepeat='no-repeat'
		bgSize='cover'
	>
		<ProjectMain />
	</Flex>
);

export default WebProjectMain;
