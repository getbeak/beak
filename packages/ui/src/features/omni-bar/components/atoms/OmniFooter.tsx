import { Box, Flex } from '@chakra-ui/react';
import Kbd from '@beak/ui/components/atoms/Kbd';
import * as React from 'react';

interface OmniFooterProps {
	mode: 'finder' | 'commands';
}

const OmniFooter: React.FC<OmniFooterProps> = ({ mode }) => (
	<Flex
		align='center'
		justify='space-between'
		px='2.5'
		py='1'
		borderTopWidth='1px'
		borderColor='border.subtle'
		fontSize='10px'
		color='fg.subtle'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 40%, transparent)'
	>
		<Flex align='center' gap='3'>
			<HintRow keys={['↑', '↓']}>{'Navigate'}</HintRow>
			<HintRow keys={['↵']}>{mode === 'finder' ? 'Open' : 'Run'}</HintRow>
			<HintRow keys={['Esc']}>{'Close'}</HintRow>
		</Flex>
		<Box opacity={0.65}>
			{mode === 'commands' ? 'Commands' : 'Finder'}
		</Box>
	</Flex>
);

const HintRow: React.FC<React.PropsWithChildren<{ keys: string[] }>> = ({ keys, children }) => (
	<Flex align='center' gap='1'>
		{keys.map(k => (
			<Kbd key={k}>{k}</Kbd>
		))}
		<Box as='span' opacity={0.75}>{children}</Box>
	</Flex>
);

export default OmniFooter;
