import { Box, Flex } from '@chakra-ui/react';
import { Eye } from 'lucide-react';
import * as React from 'react';

interface PreviewContainerProps {
	text: string;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ text }) => (
	<Box
		position='relative'
		fontSize='xs'
		fontFamily='mono'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)'
		borderTopWidth='1px'
		borderColor='border.subtle'
		mx='-3'
		mt='2.5'
		mb='2'
		px='3'
		pt='2.5'
		pb='2'
		maxH='120px'
		overflowY='auto'
		overflowX='hidden'
		overflowWrap='break-word'
		color='fg.muted'
	>
		<Flex align='center' gap='1' mb='1.5' color='accent.pink'>
			<Eye size={10} strokeWidth={2.2} />
			<Box as='span' textTransform='uppercase' fontSize='9px' fontWeight='700' letterSpacing='0.06em' fontFamily='body'>
				{'Preview'}
			</Box>
		</Flex>
		<Box color='fg.default'>
			{text || (
				<Box as='span' fontStyle='italic' color='fg.subtle'>
					{'(empty)'}
				</Box>
			)}
		</Box>
	</Box>
);

export default PreviewContainer;
