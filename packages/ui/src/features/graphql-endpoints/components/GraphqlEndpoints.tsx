import { Box, chakra, Flex } from '@chakra-ui/react';
import { Edit3, Network, Plus } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { useGraphqlEndpoints } from '../hooks/use-graphql-endpoints';
import type { GraphqlEndpointEntry } from '../lib/enumerate';
import GraphqlEndpointDialog from './GraphqlEndpointDialog';

const ChakraButton = chakra('button');

type DialogState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; entry: GraphqlEndpointEntry };

/**
 * Sidebar section listing every graphql-source collection in the project.
 * Each entry shows folder name + endpoint URL preview; click to edit.
 * The "+" affordance in the section header opens the same dialog in
 * create mode.
 */
const GraphqlEndpoints: React.FC = () => {
	const { entries, loading, refresh } = useGraphqlEndpoints();
	const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

	function closeDialog(didChange: boolean) {
		setDialog({ mode: 'closed' });
		if (didChange) void refresh();
	}

	const hasEntries = entries.length > 0;

	return (
		<React.Fragment>
			<Flex direction='column' py='1'>
				<Flex align='center' justify='space-between' px='3' pb='1'>
					<Box
						fontSize='10px'
						fontWeight='600'
						color='fg.subtle'
						letterSpacing='0.05em'
						textTransform='uppercase'
					>
						{loading
							? 'Loading…'
							: hasEntries
								? `${entries.length} endpoint${entries.length === 1 ? '' : 's'}`
								: 'No endpoints yet'}
					</Box>
					<ChakraButton
						type='button'
						aria-label='Add GraphQL endpoint'
						title='Add GraphQL endpoint'
						onClick={() => setDialog({ mode: 'create' })}
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						w='18px'
						h='18px'
						borderRadius='sm'
						border='none'
						bg='transparent'
						color='fg.muted'
						cursor='pointer'
						_hover={{
							bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)',
							color: 'accent.indigo',
						}}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
						}}
					>
						<Plus size={12} strokeWidth={2} />
					</ChakraButton>
				</Flex>

				{!hasEntries && !loading && (
					<Flex direction='column' align='center' gap='2' px='4' py='4' color='fg.subtle'>
						<Flex
							align='center'
							justify='center'
							w='28px'
							h='28px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)'
							color='accent.indigo'
						>
							<Network size={12} strokeWidth={2} />
						</Flex>
						<Box fontSize='11px' textAlign='center' lineHeight='1.45' maxW='220px'>
							{'Register a GraphQL endpoint and group every request that hits it under a single folder.'}
						</Box>
					</Flex>
				)}

				{hasEntries && (
					<Flex direction='column'>
						{entries.map(entry => {
							const endpoint = typeof entry.source.endpoint === 'string' ? entry.source.endpoint : '';
							const lastSync = entry.source.lastSyncedAt
								? new Date(entry.source.lastSyncedAt).toLocaleString()
								: 'Never synced';
							return (
								<Flex
									key={entry.folderPath}
									align='center'
									gap='2'
									px='3'
									py='1.5'
									role='button'
									tabIndex={0}
									cursor='pointer'
									onClick={() => setDialog({ mode: 'edit', entry })}
									onKeyDown={e => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											setDialog({ mode: 'edit', entry });
										}
									}}
									_hover={{
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
									}}
									_focusVisible={{
										outline: 'none',
										bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 10%, transparent)',
										boxShadow: 'inset 2px 0 0 var(--beak-colors-accent-indigo)',
									}}
								>
									<Box flexShrink={0} color='accent.indigo'>
										<Network size={11} strokeWidth={2} />
									</Box>
									<Flex direction='column' flex='1' minW={0}>
										<Box fontSize='12px' fontWeight='500' color='fg.default' truncate>
											{entry.folderName}
										</Box>
										<Box fontSize='10.5px' color='fg.subtle' truncate>
											{endpoint || '(no endpoint)'}
										</Box>
										<Box fontSize='10px' color='fg.subtle' fontStyle='italic'>
											{lastSync}
										</Box>
									</Flex>
									<ChakraButton
										type='button'
										aria-label={`Edit ${entry.folderName}`}
										title={`Edit ${entry.folderName}`}
										onClick={e => {
											e.stopPropagation();
											setDialog({ mode: 'edit', entry });
										}}
										display='inline-flex'
										alignItems='center'
										justifyContent='center'
										w='20px'
										h='20px'
										borderRadius='sm'
										border='none'
										bg='transparent'
										color='fg.subtle'
										cursor='pointer'
										flexShrink={0}
										_hover={{ color: 'fg.default' }}
									>
										<Edit3 size={11} strokeWidth={1.8} />
									</ChakraButton>
								</Flex>
							);
						})}
					</Flex>
				)}
			</Flex>

			{dialog.mode === 'create' && <GraphqlEndpointDialog mode={{ kind: 'create' }} onClose={closeDialog} />}
			{dialog.mode === 'edit' && (
				<GraphqlEndpointDialog
					mode={{ kind: 'edit', folderPath: dialog.entry.folderPath, folderName: dialog.entry.folderName }}
					initialEndpoint={
						typeof dialog.entry.source.endpoint === 'string' ? dialog.entry.source.endpoint : ''
					}
					onClose={closeDialog}
				/>
			)}
		</React.Fragment>
	);
};

export default GraphqlEndpoints;
