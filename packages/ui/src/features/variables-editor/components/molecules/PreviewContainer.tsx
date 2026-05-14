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
		<Flex align='center' gap='1.5' mb='1.5'>
			<Flex
				align='center'
				justify='center'
				w='18px'
				h='18px'
				borderRadius='sm'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				color='accent.pink'
				boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			>
				<Eye size={10} strokeWidth={2.2} />
			</Flex>
			<Box
				as='span'
				textTransform='uppercase'
				fontSize='9px'
				fontWeight='700'
				letterSpacing='0.06em'
				fontFamily='body'
				color='accent.pink'
			>
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
