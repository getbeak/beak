import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface PreviewContainerProps {
	text: string;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ text }) => (
	<Box
		position='relative'
		fontSize='sm'
		bg='bg.surface.emphasized'
		mx='-3'
		mt='2.5'
		mb='2'
		px='3'
		pt='6'
		pb='2.5'
		maxH='100px'
		overflowY='auto'
		overflowX='hidden'
		overflowWrap='break-word'
	>
		<Box position='absolute' top='1.5' left='1.5' textTransform='uppercase' fontSize='9px'>
			{'Preview'}
		</Box>
		{text}
	</Box>
);

export default PreviewContainer;
