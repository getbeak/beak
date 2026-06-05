import { Box, Flex } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import * as React from 'react';

/**
 * Renders above the request-pane header when the open request is an endpoint
 * introspection seed (i.e. `info.introspection === true`). The seed file is
 * structurally identical to any other request, so without a marker users
 * occasionally repurpose it and lose the ready-to-fire schema query.
 */
const IntrospectionBanner: React.FC = () => (
	<Flex
		align='center'
		gap='2'
		px='3'
		py='1.5'
		borderBottomWidth='1px'
		borderColor='border.subtle'
		bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 8%, var(--beak-colors-bg-surface))'
	>
		<Flex
			flexShrink={0}
			align='center'
			justify='center'
			w='18px'
			h='18px'
			borderRadius='sm'
			color='accent.indigo'
			bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
		>
			<Sparkles size={10} strokeWidth={2.2} />
		</Flex>
		<Box fontSize='11px' lineHeight='1.45' color='fg.muted'>
			<Box as='span' fontWeight='600' color='fg.default'>
				{'Endpoint introspection seed'}
			</Box>
			{
				' — this request was generated when you registered the endpoint. Hit Send to fetch the schema. Customising headers or auth is fine; replacing the query loses the canonical introspection body.'
			}
		</Box>
	</Flex>
);

export default IntrospectionBanner;
