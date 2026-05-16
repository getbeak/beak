import { Box, Flex, Grid } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import Kbd from '@beak/ui/components/atoms/Kbd';
import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';
import shortcutDefinitions, { type Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import type {
	PlatformAgnosticDefinitions,
	PlatformSpecificDefinitions,
	ShortcutDefinition,
} from '@beak/ui/lib/keyboard-shortcuts/types';
import { renderSimpleKey } from '@beak/ui/utils/keyboard-rendering';
import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

const displayShortcuts: Partial<Record<Shortcuts, string>> = {
	'menu-bar.file.new-request': 'Create new request',
	'global.execute-request': 'Execute request',
	'omni-bar.launch.commands': 'Open command bar',
	'omni-bar.launch.finder': 'Open finder bar',
	'sidebar.toggle-view': 'Toggle sidebar',
};

const MotionBox = motion.create(Box);
const MotionGrid = motion.create(Grid);

const PendingSplash: React.FC = () => {
	const reduced = useReducedMotion();

	return (
		<Box
			position='relative'
			w='100%'
			h='100%'
			overflow='hidden'
			css={{
				// Distinct from the request pane (`bg.surface`): lighter in
				// light mode, lifted in dark. Solid-enough to read as its own
				// surface, but still translucent so the mesh hints through.
				background: 'color-mix(in srgb, var(--beak-colors-bg-canvas) 88%, transparent)',
				'.dark &': {
					background: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 78%, transparent)',
				},
			}}
		>
			<Flex
				position='relative'
				w='100%'
				h='100%'
				align='center'
				justify='center'
				direction='column'
				gap='6'
				px='6'
			>
				<MotionBox
					initial={{ opacity: 0, y: 8, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.35, ease: 'easeOut' }}
				>
					<MotionBox
						w='160px'
						h='160px'
						bgImage="url('images/logo-blank.png')"
						bgRepeat='no-repeat'
						bgPos='center'
						bgSize='contain'
						opacity={0.16}
						css={{ 'html.light &': { opacity: 0.3 } }}
						animate={
							reduced
								? undefined
								: {
										transform: [
											'translate3d(0,0,0)',
											'translate3d(0,-6px,0)',
											'translate3d(0,0,0)',
										],
								  }
						}
						transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
					/>
				</MotionBox>

				<Box textAlign='center' color='accent.pink' fontSize='10px' letterSpacing='0.08em' textTransform='uppercase' fontWeight='700'>
					{'Make a request to see its details here'}
				</Box>

				<MotionGrid
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: 'easeOut', delay: 0.12 }}
					templateColumns='auto auto'
					columnGap='4'
					rowGap='2.5'
					px='2'
					py='1'
				>
					{TypedObject.keys(displayShortcuts).map(k => {
						const name = displayShortcuts[k];
						const definition = shortcutDefinition(shortcutDefinitions[k]);

						return (
							<React.Fragment key={k}>
								<Flex align='center' justify='right' fontSize='xs' color='fg.muted'>
									{name}
								</Flex>
								<Box display='inline-flex' alignItems='center' gap='0.5'>
									{Array.isArray(definition.key)
										? definition.key.map((k2, i) => (
											<React.Fragment key={k2}>
												{i > 0 && (
													<Box as='span' color='fg.subtle' mx='1'>
														{'|'}
													</Box>
												)}
												<CommandKeys definition={definition} />
												<Kbd>{renderSimpleKey(k2)}</Kbd>
											</React.Fragment>
										))
										: (
											<React.Fragment>
												<CommandKeys definition={definition} />
												<Kbd>{renderSimpleKey(definition.key)}</Kbd>
											</React.Fragment>
										)}
								</Box>
							</React.Fragment>
						);
					})}
				</MotionGrid>
			</Flex>
		</Box>
	);
};

const CommandKeys: React.FC<{ definition: ShortcutDefinition }> = ({ definition }) => {
	const darwin = windowSessionInstance.isDarwin();
	return (
		<>
			{definition.ctrlOrMeta && <Kbd>{darwin ? '⌘' : '⌃'}</Kbd>}
			{definition.ctrl && <Kbd>{'⌃'}</Kbd>}
			{definition.alt && <Kbd>{darwin ? '⌥' : 'Alt'}</Kbd>}
			{definition.meta && <Kbd>{'⌘'}</Kbd>}
			{definition.shift && <Kbd>{'⇧'}</Kbd>}
		</>
	);
};

function shortcutDefinition(definition: PlatformSpecificDefinitions | PlatformAgnosticDefinitions) {
	if (definition.type === 'agnostic') return definition;
	return windowSessionInstance.isDarwin() ? definition.darwin : definition.windows;
}

export default PendingSplash;
