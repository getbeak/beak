import { Box } from '@chakra-ui/react';
import * as React from 'react';

const ActionBarSeparator: React.FC = () => (
	<Box
		h='16px'
		w='1px'
		mx='1.5'
		bg='border.subtle'
		opacity={0.6}
		alignSelf='center'
	/>
);

export default ActionBarSeparator;
