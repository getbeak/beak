import { Box, Flex, Grid } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import Kbd from '@beak/ui/components/atoms/Kbd';
import shortcutDefinitions, { type Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import type {
	PlatformAgnosticDefinitions,
	PlatformSpecificDefinitions,
	ShortcutDefinition,
} from '@beak/ui/lib/keyboard-shortcuts/types';
import { renderSimpleKey } from '@beak/ui/utils/keyboard-rendering';
import * as React from 'react';

const displayShortcuts: Partial<Record<Shortcuts, string>> = {
	'menu-bar.file.new-request': 'Create new request',
	'global.execute-request': 'Execute request',
	'omni-bar.launch.commands': 'Open command bar',
	'omni-bar.launch.finder': 'Open finder bar',
	'sidebar.toggle-view': 'Toggle sidebar',
};

const PendingSlash: React.FC = () => (
	<Flex w='100%' h='100%' align='center' justify='center' direction='column'>
		<Box
			w='200px'
			h='200px'
			bgImage="url('images/logo-blank.png')"
			bgRepeat='no-repeat'
			bgPos='center'
			bgSize='contain'
			opacity={0.15}
			css={{ 'html.light &': { opacity: 0.3 } }}
		/>
		<Box>
			{TypedObject.keys(displayShortcuts).map(k => {
				const name = displayShortcuts[k];
				const definition = shortcutDefinition(shortcutDefinitions[k]);

				return (
					<Grid
						key={k}
						templateColumns='1fr 1fr'
						gap='2.5'
						mb='2.5'
						fontSize='sm'
						lineHeight='11px'
						color='fg.muted'
					>
						<Flex align='center' justify='right'>{name}</Flex>
						<Box display='inline-block'>
							{Array.isArray(definition.key) &&
								definition.key.map(k => (
									<React.Fragment key={k}>
										<CommandKeys definition={definition} />
										<Kbd>{renderSimpleKey(k)}</Kbd>
										<Box as='span' display='inline-block' mx='0.5' _last={{ display: 'none' }}>
											{'|'}
										</Box>
									</React.Fragment>
								))}
							{typeof definition.key === 'string' && (
								<React.Fragment>
									<CommandKeys definition={definition} />
									<Kbd>{renderSimpleKey(definition.key)}</Kbd>
								</React.Fragment>
							)}
						</Box>
					</Grid>
				);
			})}
		</Box>
	</Flex>
);

const CommandKeys: React.FC<{ definition: ShortcutDefinition }> = ({ definition }) => (
	<>
		{definition.ctrlOrMeta && <Kbd>{'⌘'}</Kbd>}
		{definition.ctrl && <Kbd>{'⌃'}</Kbd>}
		{definition.alt && <Kbd>{'⌥'}</Kbd>}
		{definition.meta && <Kbd>{'⌘'}</Kbd>}
		{definition.shift && <Kbd>{'⇧'}</Kbd>}
	</>
);

function shortcutDefinition(definition: PlatformSpecificDefinitions | PlatformAgnosticDefinitions) {
	if (definition.type === 'agnostic') return definition;
	return definition.darwin;
}

export default PendingSlash;
