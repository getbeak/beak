import { Box, Flex } from '@chakra-ui/react';
import { GitBranch } from 'lucide-react';
import * as React from 'react';

const NoProjectInformation: React.FC = () => (
	<Flex
		align='center'
		gap='2'
		px='2'
		py='1.5'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
		borderStyle='dashed'
	>
		<Flex
			align='center'
			justify='center'
			flexShrink={0}
			w='18px'
			h='18px'
			borderRadius='sm'
			bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 10%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-fg-subtle) 22%, transparent)'
			color='fg.subtle'
			boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
		>
			<GitBranch size={10} strokeWidth={2} />
		</Flex>
		<Box fontSize='11px' color='fg.muted'>{'Not tracked in Git'}</Box>
	</Flex>
);

export default NoProjectInformation;
