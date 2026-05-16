import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import { ChevronDown, Edit3, Hash, Network, Plug, Plus } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { useEndpoints } from '../hooks/use-endpoints';
import { ENDPOINT_CONFIG, type EndpointEntry, type EndpointKind } from '../types';
import EndpointDialog from './EndpointDialog';

const ChakraButton = chakra('button');

type DialogState =
	| { mode: 'closed' }
	| { mode: 'create'; kind: EndpointKind }
	| { mode: 'edit'; kind: EndpointKind; entry: EndpointEntry };

interface UnifiedRow {
	kind: EndpointKind;
	entry: EndpointEntry;
}

/**
 * Unified "Endpoints" sidebar pane. Lists every graphql + grpc-source
 * collection in one table — both kinds share the same registry shape,
 * so combining them is honest and avoids tab-switching.
 *
 * The header carries a single Add dropdown that picks the kind first,
 * then opens the dialog. Each row tags its kind with a coloured chip
 * (indigo for GraphQL, teal for gRPC) so the user can scan the table
 * without parsing the URL.
 */
const EndpointsPane: React.FC = () => {
	const graphql = useEndpoints('graphql');
	const grpc = useEndpoints('grpc');
	const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

	function closeDialog(didChange: boolean) {
		setDialog({ mode: 'closed' });
		if (didChange) {
			void graphql.refresh();
			void grpc.refresh();
		}
	}

	const rows = useMemo<UnifiedRow[]>(() => {
		const all: UnifiedRow[] = [
			...graphql.entries.map(entry => ({ kind: 'graphql' as const, entry })),
			...grpc.entries.map(entry => ({ kind: 'grpc' as const, entry })),
		];
		all.sort((a, b) => a.entry.relativeFolder.localeCompare(b.entry.relativeFolder));
		return all;
	}, [graphql.entries, grpc.entries]);

	const loading = graphql.loading || grpc.loading;
	const hasRows = rows.length > 0;

	return (
		<React.Fragment>
			<Flex direction='column' flex='1' minH={0}>
				<Flex
					align='center'
					justify='space-between'
					px='3'
					py='2'
					borderBottomWidth='1px'
					borderColor='border.subtle'
					flexShrink={0}
				>
					<Box
						fontSize='10.5px'
						fontWeight='600'
						color='fg.subtle'
						letterSpacing='0.05em'
						textTransform='uppercase'
					>
						{loading
							? 'Loading…'
							: hasRows
								? `${rows.length} registered`
								: 'Empty — no endpoints yet'}
					</Box>
					<AddDropdown onPick={kind => setDialog({ mode: 'create', kind })} />
				</Flex>

				<Box flex='1' minH={0} overflowY='auto'>
					{!hasRows && !loading && (
						<EmptyState onPick={kind => setDialog({ mode: 'create', kind })} />
					)}

					{hasRows && (
						<Flex direction='column' py='1'>
							{rows.map(({ kind, entry }) => (
								<EndpointRow
									key={entry.folderPath}
									kind={kind}
									entry={entry}
									onEdit={() => setDialog({ mode: 'edit', kind, entry })}
								/>
							))}
						</Flex>
					)}
				</Box>
			</Flex>

			{dialog.mode === 'create' && (
				<EndpointDialog endpointKind={dialog.kind} mode={{ kind: 'create' }} onClose={closeDialog} />
			)}
			{dialog.mode === 'edit' && (
				<EndpointDialog
					endpointKind={dialog.kind}
					mode={{
						kind: 'edit',
						folderPath: dialog.entry.folderPath,
						folderName: dialog.entry.folderName,
					}}
					initialEndpoint={typeof dialog.entry.source.endpoint === 'string' ? dialog.entry.source.endpoint : ''}
					onClose={closeDialog}
				/>
			)}
		</React.Fragment>
	);
};

// ─── Add dropdown ─────────────────────────────────────────────────────────

const AddDropdown: React.FC<{ onPick: (kind: EndpointKind) => void }> = ({ onPick }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<ChakraButton
				type='button'
				aria-label='Add endpoint'
				title='Add endpoint'
				display='inline-flex'
				alignItems='center'
				gap='1'
				h='22px'
				px='2'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='transparent'
				color='fg.muted'
				fontSize='11px'
				fontWeight='500'
				cursor='pointer'
				transition='border-color .12s ease, background-color .12s ease, color .12s ease'
				_hover={{
					color: 'fg.default',
					bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
				}}
				css={{
					'&[data-state="open"]': {
						color: 'var(--beak-colors-fg-default)',
						background: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
					},
					'&[data-state="open"] svg.lucide-chevron-down': { transform: 'rotate(180deg)' },
					'svg.lucide-chevron-down': { transition: 'transform .16s cubic-bezier(0.16, 1, 0.3, 1)' },
				}}
			>
				<Plus size={11} strokeWidth={2} />
				<Box as='span'>{'Add'}</Box>
				<ChevronDown size={11} strokeWidth={1.8} style={{ opacity: 0.6 }} />
			</ChakraButton>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content
					bg='bg.surface.emphasized'
					borderWidth='1px'
					borderColor='border.default'
					borderRadius='md'
					boxShadow='0 8px 24px rgba(0,0,0,0.28)'
					p='1'
					minW='200px'
				>
					<KindMenuItem kind='graphql' onPick={onPick} />
					<KindMenuItem kind='grpc' onPick={onPick} />
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

const KindMenuItem: React.FC<{ kind: EndpointKind; onPick: (kind: EndpointKind) => void }> = ({ kind, onPick }) => {
	const config = ENDPOINT_CONFIG[kind];
	const Icon = kind === 'graphql' ? Hash : Network;
	return (
		<Menu.Item
			value={kind}
			onClick={() => onPick(kind)}
			fontSize='12px'
			fontWeight='500'
			borderRadius='sm'
			py='1.5'
			px='2'
			gap='2'
			color='fg.default'
			_hover={{
				bg: `color-mix(in srgb, ${config.accentVar} 12%, transparent)`,
				color: config.accentToken,
			}}
		>
			<Box color={config.accentToken}>
				<Icon size={12} strokeWidth={1.8} />
			</Box>
			<Flex direction='column' align='flex-start' gap='0' minW={0}>
				<Box as='span' fontWeight='600'>
					{config.label}
				</Box>
				<Box as='span' fontSize='10.5px' color='fg.subtle' fontWeight='400'>
					{kind === 'graphql' ? 'Register a GraphQL endpoint' : 'Register a gRPC service'}
				</Box>
			</Flex>
		</Menu.Item>
	);
};

// ─── Empty state ──────────────────────────────────────────────────────────

const EmptyState: React.FC<{ onPick: (kind: EndpointKind) => void }> = ({ onPick }) => (
	<Flex direction='column' align='center' gap='3' px='5' py='8' color='fg.subtle'>
		<Flex
			align='center'
			justify='center'
			w='40px'
			h='40px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)'
			color='accent.indigo'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent)'
		>
			<Plug size={16} strokeWidth={1.8} />
		</Flex>
		<Box fontSize='12.5px' fontWeight='600' color='fg.default'>
			{'No endpoints registered'}
		</Box>
		<Box fontSize='11px' textAlign='center' lineHeight='1.5' maxW='240px'>
			{'Register a GraphQL endpoint or gRPC service to group every request that hits it under a single folder.'}
		</Box>
		<Flex gap='2' mt='1'>
			<EmptyStateAddButton kind='graphql' onPick={onPick} />
			<EmptyStateAddButton kind='grpc' onPick={onPick} />
		</Flex>
	</Flex>
);

const EmptyStateAddButton: React.FC<{ kind: EndpointKind; onPick: (kind: EndpointKind) => void }> = ({
	kind,
	onPick,
}) => {
	const config = ENDPOINT_CONFIG[kind];
	const Icon = kind === 'graphql' ? Hash : Network;
	return (
		<ChakraButton
			type='button'
			onClick={() => onPick(kind)}
			display='inline-flex'
			alignItems='center'
			gap='1.5'
			h='26px'
			px='3'
			borderRadius='full'
			border='none'
			bg={config.accentToken}
			color='fg.onAccent'
			fontSize='11.5px'
			fontWeight='600'
			cursor='pointer'
			boxShadow={`0 4px 10px color-mix(in srgb, ${config.accentVar} 35%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)`}
			transition='filter .12s ease, transform .08s ease'
			_hover={{ filter: 'brightness(1.06)' }}
			_active={{ transform: 'translateY(0.5px)' }}
		>
			<Icon size={11} strokeWidth={2.4} />
			{kind === 'graphql' ? 'GraphQL' : 'gRPC'}
		</ChakraButton>
	);
};

// ─── Row ──────────────────────────────────────────────────────────────────

const EndpointRow: React.FC<{ kind: EndpointKind; entry: EndpointEntry; onEdit: () => void }> = ({
	kind,
	entry,
	onEdit,
}) => {
	const config = ENDPOINT_CONFIG[kind];
	const Icon = kind === 'graphql' ? Hash : Network;
	const endpoint = typeof entry.source.endpoint === 'string' ? entry.source.endpoint : '';
	const lastSync = entry.source.lastSyncedAt ? new Date(entry.source.lastSyncedAt).toLocaleString() : null;
	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='1.5'
			role='button'
			tabIndex={0}
			cursor='pointer'
			onClick={onEdit}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onEdit();
				}
			}}
			_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)' }}
			_focusVisible={{
				outline: 'none',
				bg: `color-mix(in srgb, ${config.accentVar} 10%, transparent)`,
				boxShadow: `inset 2px 0 0 ${config.accentVar}`,
			}}
		>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='22px'
				h='22px'
				borderRadius='sm'
				bg={`color-mix(in srgb, ${config.accentVar} 12%, transparent)`}
				color={config.accentToken}
			>
				<Icon size={11} strokeWidth={2} />
			</Flex>
			<Flex direction='column' flex='1' minW={0}>
				<Flex align='center' gap='1.5'>
					<Box fontSize='12px' fontWeight='500' color='fg.default' truncate>
						{entry.folderName}
					</Box>
					<Box
						as='span'
						display='inline-flex'
						alignItems='center'
						h='14px'
						px='1.5'
						borderRadius='sm'
						bg={`color-mix(in srgb, ${config.accentVar} 14%, transparent)`}
						color={config.accentToken}
						fontSize='9.5px'
						fontWeight='600'
						letterSpacing='0.04em'
						textTransform='uppercase'
					>
						{kind === 'graphql' ? 'GraphQL' : 'gRPC'}
					</Box>
				</Flex>
				<Box fontSize='10.5px' color='fg.subtle' fontFamily='mono' truncate>
					{endpoint || '(no endpoint set)'}
				</Box>
				{lastSync && (
					<Box fontSize='10px' color='fg.subtle' fontStyle='italic'>
						{`Synced ${lastSync}`}
					</Box>
				)}
			</Flex>
			<ChakraButton
				type='button'
				aria-label={`Edit ${entry.folderName}`}
				title={`Edit ${entry.folderName}`}
				onClick={e => {
					e.stopPropagation();
					onEdit();
				}}
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				w='22px'
				h='22px'
				borderRadius='sm'
				border='none'
				bg='transparent'
				color='fg.subtle'
				cursor='pointer'
				flexShrink={0}
				_hover={{ color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
			>
				<Edit3 size={11} strokeWidth={1.8} />
			</ChakraButton>
		</Flex>
	);
};

export default EndpointsPane;
