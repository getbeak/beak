import type { GrpcEnumDescriptor, GrpcMessageDescriptor, InvokeUnaryRes } from '@beak/common/ipc/grpc';
import type { GrpcDescriptor } from '@beak/state/schemas';
import Button from '@beak/ui/components/atoms/Button';
import EditorView from '@beak/ui/components/atoms/EditorView';
import { ipcGrpcService } from '@beak/ui/lib/ipc';
import { type ResolveGrpcContextResult, resolveGrpcContext } from '@beak/ui/services/grpc/resolve-descriptor';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { Nodes, ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyGrpc } from '@getbeak/types/request';
import { AlertOctagon, Braces, KeyRound, ListTree, Network, Play, Plus, Save, Trash2 } from 'lucide-react';
import path from 'path-browserify';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ipcFsService } from '../../../lib/ipc';
import { requestBodyGrpcMetadataChanged, requestBodyGrpcRequestJsonChanged } from '../../../store/project/actions';
import { readGrpcDescriptor } from '../../source-schemas/lib/persist';
import GrpcFieldsEditor from './grpc/GrpcFieldsEditor';

interface GrpcRequestPaneProps {
	node: ValidRequestNode;
}

interface ResolvedContext {
	folderPath: string;
	endpoint: string;
	descriptor: GrpcDescriptor;
}

type RequestTab = 'fields' | 'json' | 'metadata';

/**
 * Replaces the HTTP-shaped request pane when the open request is a gRPC
 * method invocation (`body.type === 'grpc'`). The endpoint + descriptor
 * come from the parent collection file rather than the request itself, so
 * one source of truth covers every method in a folder.
 *
 * Layout: a thin header showing service/method, a Monaco JSON editor for
 * the request body, a Send button, and an inline response pane. Streaming
 * methods get filtered out at discovery time, so anything that lands here
 * is unary.
 */
const GrpcRequestPane: React.FC<GrpcRequestPaneProps> = ({ node }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const body = node.info.body as RequestBodyGrpc;

	const [context, setContext] = useState<ResolvedContext | null>(null);
	const [contextError, setContextError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<InvokeUnaryRes | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<RequestTab>('fields');
	const [messagesByName, setMessagesByName] = useState<Record<string, GrpcMessageDescriptor>>({});
	const [enumsByName, setEnumsByName] = useState<Record<string, GrpcEnumDescriptor>>({});

	// Resolve the request message's FQ name by looking up the method on the
	// loaded service descriptor. Reflection sometimes hands back leading-dot
	// FQ names; tolerate either form when indexing the messages map.
	const [requestMessageName, setRequestMessageName] = useState<string | null>(null);

	// Walk up the project tree to find the gRPC endpoint folder this request
	// belongs to, then read its `_collection.json` for the endpoint URL +
	// descriptor. We do it on mount + when the node moves so a drag-and-drop
	// re-roots the call against the correct collection.
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const folderPath = findOwningEndpointFolder(node, tree);
			if (!folderPath) {
				setContextError(
					"This request file isn't inside a gRPC endpoint folder — Beak can't tell which service to talk to. Move it under `tree/endpoints/grpc/<endpoint>/` or re-run Discover.",
				);
				return;
			}
			const result = await resolveGrpcContext(
				{ folderPath, service: body.payload.service, method: body.payload.method },
				{
					readCollection: collectionPath => ipcFsService.readJson<unknown>(collectionPath),
					readDescriptorSidecar: readGrpcDescriptor,
					joinPath: (folder, file) => path.join(folder, file),
				},
			);
			if (cancelled) return;
			if (result.kind !== 'ok') {
				setContextError(messageForResolveError(result));
				return;
			}
			setContext({ folderPath, endpoint: result.endpoint, descriptor: result.descriptor });
			setContextError(null);
			setMessagesByName(result.messagesByName);
			setEnumsByName(result.enumsByName);
			setRequestMessageName(result.requestMessageName);
		})();
		return () => {
			cancelled = true;
		};
	}, [node.id, node.parent, tree, body.payload.service, body.payload.method]);

	async function invoke() {
		if (!context) return;
		setPending(true);
		setError(null);
		setResult(null);
		try {
			const res = await ipcGrpcService.invokeUnary({
				endpoint: context.endpoint,
				descriptor: context.descriptor,
				service: body.payload.service,
				method: body.payload.method,
				requestJson: body.payload.requestJson,
				// Only send metadata when the user actually authored some — an
				// empty record on the wire would still be valid but it's
				// noise to anyone tailing the host's gRPC logs.
				...(body.payload.metadata && Object.keys(body.payload.metadata).length > 0
					? { metadata: body.payload.metadata }
					: {}),
			});
			setResult(res);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setPending(false);
		}
	}

	function onMetadataChange(next: Record<string, string>) {
		dispatch(requestBodyGrpcMetadataChanged({ requestId: node.id, metadata: next }));
	}

	function updateRequestJson(text: string | undefined) {
		dispatch(
			requestBodyGrpcRequestJsonChanged({
				requestId: node.id,
				requestJson: text ?? '',
			}),
		);
	}

	// Parsed view of the JSON body. The Fields editor reads/writes against
	// this; we don't keep a separate state for it because that risks the
	// two tabs drifting out of sync. Parse errors fall back to `{}` so the
	// editor can still render with empty inputs.
	const requestObject = useMemo<Record<string, unknown>>(() => {
		const text = body.payload.requestJson.trim();
		if (text.length === 0) return {};
		try {
			const parsed = JSON.parse(text);
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}, [body.payload.requestJson]);
	const jsonParseError = useMemo<string | null>(() => {
		const text = body.payload.requestJson.trim();
		if (text.length === 0) return null;
		try {
			JSON.parse(text);
			return null;
		} catch (err) {
			return err instanceof Error ? err.message : String(err);
		}
	}, [body.payload.requestJson]);

	function onFieldsChange(next: Record<string, unknown>) {
		dispatch(
			requestBodyGrpcRequestJsonChanged({
				requestId: node.id,
				requestJson: JSON.stringify(next, null, '\t'),
			}),
		);
	}

	return (
		<Flex direction='column' h='100%' w='100%' bg='bg.surface'>
			<MethodHeader
				service={body.payload.service}
				method={body.payload.method}
				endpoint={context?.endpoint ?? '…'}
				pending={pending}
				onSend={invoke}
				canSend={Boolean(context) && !pending}
			/>

			{contextError && (
				<Flex
					align='flex-start'
					gap='2'
					px='3'
					py='2'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
					borderBottomWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 36%, var(--beak-colors-border-subtle))'
					fontSize='xs'
				>
					<Box color='accent.alert' flex='0 0 auto' mt='0.5'>
						<AlertOctagon size={11} strokeWidth={2.2} />
					</Box>
					<Box color='fg.default' lineHeight='1.55'>
						{contextError}
					</Box>
				</Flex>
			)}

			<Flex direction='column' flex='1' minH={0}>
				<TabBar
					active={activeTab}
					onChange={setActiveTab}
					hasParseError={jsonParseError !== null}
					metadataCount={body.payload.metadata ? Object.keys(body.payload.metadata).length : 0}
				/>
				{activeTab === 'fields' && (
					<Box flex='1' minH={0} overflowY='auto' px='3' py='2'>
						{jsonParseError && (
							<Box
								mb='2'
								px='2.5'
								py='1.5'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 36%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-warning) 10%, var(--beak-colors-bg-surface))'
								fontSize='11px'
								color='fg.default'
							>
								{`JSON parse error — fields editor is showing the last good shape. Fix the JSON tab to keep them in sync: ${jsonParseError}`}
							</Box>
						)}
						{requestMessageName ? (
							<GrpcFieldsEditor
								requestType={requestMessageName}
								messages={messagesByName}
								enums={enumsByName}
								value={requestObject}
								onChange={onFieldsChange}
							/>
						) : (
							<Box fontSize='11px' color='fg.subtle' lineHeight='1.55'>
								{`Beak doesn't have a descriptor for ${body.payload.service}.${body.payload.method}'s request — re-run Discover on the endpoint, or use the JSON tab to author the request directly.`}
							</Box>
						)}
					</Box>
				)}
				{activeTab === 'json' && (
					<Box flex='1' minH={0}>
						<EditorView language='json' value={body.payload.requestJson} onChange={updateRequestJson} />
					</Box>
				)}
				{activeTab === 'metadata' && (
					<Box flex='1' minH={0} overflowY='auto' px='3' py='2'>
						<MetadataEditor metadata={body.payload.metadata ?? {}} onChange={onMetadataChange} />
					</Box>
				)}

				{(result || error) && (
					<Box borderTopWidth='1px' borderColor='border.subtle' bg='bg.canvas' flexShrink={0} maxH='40%' overflowY='auto'>
						<Flex align='center' gap='2' px='3' py='1.5'>
							<Box fontSize='10px' fontWeight='700' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase'>
								{'Response'}
							</Box>
							{result && <StatusBadge status={result.status} />}
							{result && (
								<Box ml='auto' fontSize='10.5px' color='fg.subtle'>
									{`${result.durationMs}ms`}
								</Box>
							)}
						</Flex>
						<Box
							as='pre'
							px='3'
							pb='3'
							m='0'
							fontFamily='mono'
							fontSize='11.5px'
							color='fg.default'
							whiteSpace='pre-wrap'
							wordBreak='break-word'
						>
							{error
								? error
								: result?.status === 0
									? formatJson(result.responseJson)
									: result?.statusMessage || `gRPC code ${result?.status}`}
						</Box>
					</Box>
				)}
			</Flex>
		</Flex>
	);
};

const ChakraSpan = chakra('span');
const ChakraButton = chakra('button');

interface TabBarProps {
	active: RequestTab;
	onChange: (next: RequestTab) => void;
	hasParseError: boolean;
	metadataCount: number;
}

const TabBar: React.FC<TabBarProps> = ({ active, onChange, hasParseError, metadataCount }) => (
	<Flex align='center' gap='0.5' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface' px='2'>
		<TabButton
			active={active === 'fields'}
			onClick={() => onChange('fields')}
			icon={<ListTree size={11} strokeWidth={2} />}
			label='Fields'
		/>
		<TabButton
			active={active === 'json'}
			onClick={() => onChange('json')}
			icon={<Braces size={11} strokeWidth={2} />}
			label='JSON'
			alert={hasParseError}
		/>
		<TabButton
			active={active === 'metadata'}
			onClick={() => onChange('metadata')}
			icon={<KeyRound size={11} strokeWidth={2} />}
			label='Metadata'
			badge={metadataCount > 0 ? String(metadataCount) : undefined}
		/>
	</Flex>
);

const TabButton: React.FC<{
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	alert?: boolean;
	badge?: string;
}> = ({ active, onClick, icon, label, alert, badge }) => (
	<ChakraButton
		type='button'
		onClick={onClick}
		display='inline-flex'
		alignItems='center'
		gap='1.5'
		h='28px'
		px='2.5'
		border='none'
		bg='transparent'
		color={active ? 'fg.default' : 'fg.muted'}
		fontSize='11.5px'
		fontWeight={active ? '600' : '500'}
		cursor='pointer'
		position='relative'
		borderBottomWidth='2px'
		borderColor={active ? 'accent.teal' : 'transparent'}
		_hover={{ color: 'fg.default' }}
	>
		{icon}
		{label}
		{alert && <Box w='5px' h='5px' borderRadius='full' bg='accent.alert' ml='0.5' />}
		{badge && (
			<Box
				as='span'
				ml='0.5'
				h='13px'
				minW='13px'
				px='1'
				borderRadius='sm'
				bg='color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)'
				color='accent.teal'
				fontSize='9.5px'
				fontWeight='600'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
			>
				{badge}
			</Box>
		)}
	</ChakraButton>
);

interface MethodHeaderProps {
	service: string;
	method: string;
	endpoint: string;
	pending: boolean;
	canSend: boolean;
	onSend: () => void;
}

const MethodHeader: React.FC<MethodHeaderProps> = ({ service, method, endpoint, pending, canSend, onSend }) => (
	<Flex align='center' gap='3' px='3' py='2' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
		<Flex
			align='center'
			justify='center'
			flexShrink={0}
			w='28px'
			h='28px'
			borderRadius='sm'
			bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
			color='accent.teal'
		>
			<Network size={13} strokeWidth={2} />
		</Flex>
		<Flex direction='column' flex='1' minW={0}>
			<Flex align='baseline' gap='1.5'>
				<ChakraSpan fontSize='13px' fontWeight='600' color='fg.default'>
					{service}
				</ChakraSpan>
				<ChakraSpan fontSize='13px' color='fg.subtle'>
					·
				</ChakraSpan>
				<ChakraSpan fontSize='13px' fontWeight='600' color='accent.teal'>
					{method}
				</ChakraSpan>
			</Flex>
			<ChakraSpan fontSize='10.5px' color='fg.subtle' fontFamily='mono'>
				{endpoint}
			</ChakraSpan>
		</Flex>
		<Button size='sm' disabled={!canSend} onClick={onSend}>
			<Flex align='center' gap='1.5'>
				{pending ? <Save size={11} strokeWidth={2.2} /> : <Play size={11} strokeWidth={2.2} />}
				{pending ? 'Sending…' : 'Send'}
			</Flex>
		</Button>
	</Flex>
);

const ChakraInput = chakra('input');

interface MetadataEditorProps {
	metadata: Record<string, string>;
	onChange: (next: Record<string, string>) => void;
}

/**
 * Lightweight key/value editor for gRPC metadata. Each row is keyed by the
 * key's index in iteration order — when the user renames a key we
 * effectively delete the old entry and insert the new one, so empty keys
 * stay valid while typing without producing duplicate entries on the wire.
 *
 * No drag-to-reorder yet — gRPC metadata is order-insensitive for the
 * common case (auth tokens, request IDs), so the table just appends.
 */
const MetadataEditor: React.FC<MetadataEditorProps> = ({ metadata, onChange }) => {
	const entries = useMemo(() => Object.entries(metadata), [metadata]);

	function updateRow(index: number, nextKey: string, nextValue: string) {
		const out: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i === index) {
				if (nextKey.length > 0) out[nextKey] = nextValue;
			} else {
				out[k] = v;
			}
		});
		onChange(out);
	}

	function removeRow(index: number) {
		const out: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i === index) return;
			out[k] = v;
		});
		onChange(out);
	}

	function addRow() {
		// Append an empty row by inserting a key the user can immediately
		// rename. Keys are lowercased on the wire so we pre-lower to match
		// what the host will send.
		const placeholder = `header-${entries.length + 1}`;
		onChange({ ...metadata, [placeholder]: '' });
	}

	return (
		<Flex direction='column' gap='2'>
			<Box fontSize='10.5px' color='fg.subtle' lineHeight='1.5'>
				{'Sent as request-side gRPC metadata. Keys lowercase on the wire; `-bin` suffix takes base64 binary.'}
			</Box>
			<Flex direction='column' gap='1'>
				{entries.length === 0 && (
					<Box
						fontSize='11px'
						color='fg.subtle'
						fontStyle='italic'
						px='2'
						py='1.5'
						borderRadius='md'
						borderWidth='1px'
						borderColor='border.subtle'
						borderStyle='dashed'
					>
						{'No metadata yet — click Add row to attach an auth token, request id, etc.'}
					</Box>
				)}
				{entries.map(([key, value], index) => (
					<Flex key={`${index}-${key}`} align='center' gap='1.5'>
						<ChakraInput
							type='text'
							value={key}
							placeholder='key'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(index, e.currentTarget.value, value)}
							flex='1'
							h='26px'
							px='1.5'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							color='fg.default'
							fontFamily='mono'
							fontSize='11.5px'
							outline='none'
						/>
						<ChakraInput
							type='text'
							value={value}
							placeholder='value'
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(index, key, e.currentTarget.value)}
							flex='2'
							h='26px'
							px='1.5'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							color='fg.default'
							fontFamily='mono'
							fontSize='11.5px'
							outline='none'
						/>
						<ChakraButton
							type='button'
							onClick={() => removeRow(index)}
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
							_hover={{ color: 'accent.alert' }}
							aria-label={`Remove ${key}`}
						>
							<Trash2 size={11} strokeWidth={2} />
						</ChakraButton>
					</Flex>
				))}
			</Flex>
			<ChakraButton
				type='button'
				onClick={addRow}
				display='inline-flex'
				alignItems='center'
				gap='1.5'
				h='24px'
				px='2'
				borderRadius='sm'
				border='none'
				bg='transparent'
				color='accent.teal'
				fontSize='11.5px'
				fontWeight='500'
				cursor='pointer'
				w='fit-content'
				_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 12%, transparent)' }}
			>
				<Plus size={11} strokeWidth={2} />
				{'Add row'}
			</ChakraButton>
		</Flex>
	);
};

const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
	const ok = status === 0;
	return (
		<ChakraSpan
			display='inline-flex'
			alignItems='center'
			h='14px'
			px='1.5'
			borderRadius='sm'
			bg={
				ok
					? 'color-mix(in srgb, var(--beak-colors-accent-success) 14%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
			}
			color={ok ? 'accent.success' : 'accent.alert'}
			fontSize='9.5px'
			fontWeight='700'
			letterSpacing='0.04em'
			textTransform='uppercase'
		>
			{ok ? 'OK · 0' : `${gRpcCodeName(status)} · ${status}`}
		</ChakraSpan>
	);
};

function findOwningEndpointFolder(node: ValidRequestNode, tree: Record<string, Nodes>): string | null {
	// Walk up the parent chain looking for a folder under `tree/endpoints/grpc/`.
	// The standard layout is `tree/endpoints/grpc/<endpoint-folder>/<method>.json`
	// so a single hop usually finds it; the loop covers nested groupings if
	// a user manually organised methods into sub-folders.
	let current: Nodes | undefined = tree[node.id];
	while (current?.parent) {
		const parent = Object.values(tree).find(n => n.type === 'folder' && n.filePath === current!.parent);
		if (!parent) return null;
		const parentPath = parent.filePath;
		if (/(^|\/)tree\/endpoints\/grpc\/[^/]+$/.test(parentPath)) return parentPath;
		current = parent;
	}
	return null;
}

function gRpcCodeName(code: number): string {
	const names: Record<number, string> = {
		0: 'OK',
		1: 'CANCELLED',
		2: 'UNKNOWN',
		3: 'INVALID_ARGUMENT',
		4: 'DEADLINE_EXCEEDED',
		5: 'NOT_FOUND',
		6: 'ALREADY_EXISTS',
		7: 'PERMISSION_DENIED',
		8: 'RESOURCE_EXHAUSTED',
		9: 'FAILED_PRECONDITION',
		10: 'ABORTED',
		11: 'OUT_OF_RANGE',
		12: 'UNIMPLEMENTED',
		13: 'INTERNAL',
		14: 'UNAVAILABLE',
		15: 'DATA_LOSS',
		16: 'UNAUTHENTICATED',
	};
	return names[code] ?? `CODE_${code}`;
}

function formatJson(s: string): string {
	if (!s) return '';
	try {
		return JSON.stringify(JSON.parse(s), null, 2);
	} catch {
		return s;
	}
}

/**
 * Translate a structured `ResolveGrpcContextResult` error into the
 * user-facing string the pane shows. Lives next to its only caller so
 * the wording can evolve without round-tripping through the service.
 */
function messageForResolveError(result: Exclude<ResolveGrpcContextResult, { kind: 'ok' }>): string {
	switch (result.reason) {
		case 'collection-invalid':
			return `Collection at ${result.collectionPath} failed validation — re-run Discover.`;
		case 'not-grpc-source':
			return 'Parent collection is not a gRPC source — this request file is misplaced.';
		case 'no-descriptor':
			return 'Parent collection has no descriptor set — edit the endpoint to pick reflection / proto / buf.';
		case 'caught':
			return result.message;
	}
}

export default GrpcRequestPane;
