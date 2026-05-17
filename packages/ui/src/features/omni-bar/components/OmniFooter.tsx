import Kbd from '@beak/ui/components/atoms/Kbd';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

import { CATEGORY_META } from '../lib/categories';
import type { OmniCategoryScope } from '../lib/search';
import type { OmniCategoryKey } from '../lib/types';

interface OmniFooterProps {
	scope: OmniCategoryScope;
	activeCategory?: OmniCategoryKey;
	resultCount: number;
}

const OmniFooter: React.FC<OmniFooterProps> = ({ scope, activeCategory, resultCount }) => {
	const meta = activeCategory ? CATEGORY_META[activeCategory] : undefined;
	const verb = activeCategory === 'commands' ? 'Run' : 'Open';
	const accent = meta?.accent ?? 'var(--beak-colors-accent-pink)';

	return (
		<Flex
			align='center'
			justify='space-between'
			px='3'
			py='1.5'
			borderTopWidth='1px'
			borderColor='border.subtle'
			fontSize='10px'
			color='fg.subtle'
			bg='bg.subtle'
			gap='3'
		>
			<Flex align='center' gap='3'>
				<HintRow keys={['↑', '↓']}>{'Navigate'}</HintRow>
				<HintRow keys={['↵']}>{verb}</HintRow>
				<HintRow keys={['Esc']}>{'Close'}</HintRow>
			</Flex>

			<Flex align='center' gap='2'>
				<Box fontSize='9.5px' color='fg.disabled'>
					{resultCount === 0 ? 'No results' : `${resultCount} result${resultCount === 1 ? '' : 's'}`}
				</Box>
				<Box
					px='1.5'
					py='0.5'
					fontSize='9.5px'
					fontWeight='700'
					letterSpacing='0.08em'
					textTransform='uppercase'
					borderRadius='sm'
					style={{
						background: `color-mix(in srgb, ${accent} 16%, transparent)`,
						color: accent,
						boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 28%, transparent)`,
					}}
				>
					{scope === 'commands'
						? 'Commands'
						: scope === 'recents'
							? 'Recents'
							: scope === 'workflows'
								? 'Workflows'
								: (meta?.label ?? 'All')}
				</Box>
			</Flex>
		</Flex>
	);
};

const HintRow: React.FC<React.PropsWithChildren<{ keys: string[] }>> = ({ keys, children }) => (
	<Flex align='center' gap='1'>
		{keys.map(k => (
			<Kbd key={k}>{k}</Kbd>
		))}
		<Box as='span' color='fg.muted'>
			{children}
		</Box>
	</Flex>
);

export default OmniFooter;
