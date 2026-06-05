import { Box, chakra, Flex } from '@chakra-ui/react';
import { GitBranch, Plus } from 'lucide-react';
import * as React from 'react';

interface NoProjectInformationProps {
	onInitialise?: () => void;
}

const ChakraButton = chakra('button');

const NoProjectInformation: React.FC<NoProjectInformationProps> = ({ onInitialise }) => (
	<Flex align='center' gap='2' px='3' py='1' color='fg.muted'>
		<GitBranch size={12} strokeWidth={1.8} />
		<Box flex='1 1 auto' fontSize='xs'>
			{'Not tracked in Git'}
		</Box>
		{onInitialise && (
			<ChakraButton
				type='button'
				onClick={onInitialise}
				ml='auto'
				display='inline-flex'
				alignItems='center'
				gap='1'
				h='20px'
				px='1.5'
				borderRadius='sm'
				fontSize='11.5px'
				fontWeight='500'
				color='fg.muted'
				borderWidth='1px'
				borderColor='transparent'
				bg='transparent'
				cursor='pointer'
				transition='color .1s linear, background-color .1s linear, border-color .1s linear'
				_hover={{
					color: 'fg.default',
					borderColor: 'border.default',
					bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
				}}
				title='Initialise a git repository in this project'
			>
				<Plus size={11} strokeWidth={2.2} />
				<Box>{'Init'}</Box>
			</ChakraButton>
		)}
	</Flex>
);

export default NoProjectInformation;
