import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import type { RequestOverrides, WorkflowNode } from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, Button, Flex, IconButton as ChakraIconButton, Input, NativeSelect, Stack, Tabs, Textarea } from '@chakra-ui/react';
import type { RequestNode } from '@getbeak/types/nodes';
import { ExternalLink, Play, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import KeyValueEditor from './KeyValueEditor';

interface NodePropertiesPanelProps {
	workflowId: string;
	node: WorkflowNode;
	onClose: () => void;
}

/**
 * Right-side panel that shows up when a node is selected on the canvas. The
 * panel chrome is shared (header, close, delete) and the body dispatches to a
 * kind-specific editor. Editors patch only the `data` field via
 * `updateNodeData` so node-kind invariants stay locked.
 */
const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({ workflowId, node, onClose }) => {
	const dispatch = useDispatch();

	return (
		<Flex
			direction='column'
			w='360px'
			flexShrink={0}
			bg='bg.surface'
			borderLeftWidth='1px'
			borderColor='border.subtle'
			minH={0}
		>
			<Flex align='center' h='38px' px='3' gap='2' borderBottomWidth='1px' borderColor='border.subtle' flexShrink={0}>
				<Box
					fontSize='10px'
					fontWeight='700'
					color='fg.muted'
					textTransform='uppercase'
					letterSpacing='0.06em'
					flex='1'
					minW={0}
					whiteSpace='nowrap'
					overflow='hidden'
					textOverflow='ellipsis'
				>
					{kindLabel(node.type)}
				</Box>
				{/* Start nodes are workflow-scoped singletons; hide Delete so the user
				    can't strand a workflow without an entry point. */}
				{node.type !== 'start' && (
					<TinyIconButton ariaLabel='Delete node' onClick={() => dispatch(workflowActions.removeNode({ id: workflowId, nodeId: node.id }))}>
						<Trash2 size={13} strokeWidth={1.8} />
					</TinyIconButton>
				)}
				<TinyIconButton ariaLabel='Close panel' onClick={onClose}>
					<X size={14} strokeWidth={1.8} />
				</TinyIconButton>
			</Flex>

			<Box flex='1' minH={0} overflowY='auto'>
				<NodeBody workflowId={workflowId} node={node} />
			</Box>
		</Flex>
	);
};

function NodeBody({ workflowId, node }: { workflowId: string; node: WorkflowNode }) {
	switch (node.type) {
		case 'start':
			return <StartEditor />;
		case 'request':
			return <RequestEditor workflowId={workflowId} node={node} />;
		case 'loop':
			return <LoopEditor workflowId={workflowId} node={node} />;
		case 'condition':
			return <ConditionEditor workflowId={workflowId} node={node} />;
		case 'notification':
			return <NotificationEditor workflowId={workflowId} node={node} />;
	}
}

// ── Start ────────────────────────────────────────────────────────────────────

function StartEditor() {
	return (
		<Stack gap='3' px='3' py='3'>
			<Flex
				align='center'
				gap='2'
				p='2.5'
				borderRadius='sm'
				bg='color-mix(in srgb, var(--beak-colors-accent-success) 10%, transparent)'
				color='accent.success'
			>
				<Play size={14} strokeWidth={2} fill='currentColor' />
				<Box fontSize='12px' fontWeight='600'>
					{'Workflow entry point'}
				</Box>
			</Flex>
			<HelperText>
				{'Every workflow begins here. Connect this node’s output to the first step you want to run. Exactly one start node per workflow.'}
			</HelperText>
		</Stack>
	);
}

// ── Request ──────────────────────────────────────────────────────────────────

function RequestEditor({ workflowId, node }: { workflowId: string; node: Extract<WorkflowNode, { type: 'request' }> }) {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const linked = useAppSelector(s => {
		if (!node.data.requestId) return undefined;
		const t = s.global.project.tree[node.data.requestId];
		return t?.type === 'request' ? t : undefined;
	});

	const requests = useMemo(() => {
		const all = Object.values(tree).filter((n): n is RequestNode => n.type === 'request');
		return all.sort((a, b) => a.name.localeCompare(b.name));
	}, [tree]);

	const overrides: RequestOverrides = node.data.overrides ?? {};

	function patchOverrides(patch: Partial<RequestOverrides>) {
		dispatch(
			workflowActions.updateNodeData({
				id: workflowId,
				nodeId: node.id,
				data: { overrides: { ...overrides, ...patch } },
			}),
		);
	}

	const verb = linked?.mode === 'valid' ? linked.info.verb : null;
	const urlPreview = linked?.mode === 'valid' ? previewValueSections(linked.info.url) : '';

	return (
		<Stack gap='0'>
			<Stack gap='3' px='3' py='3' borderBottomWidth='1px' borderColor='border.subtle'>
				<Stack gap='1'>
					<FieldLabel>{'Linked request'}</FieldLabel>
					<NativeSelect.Root size='sm'>
						<NativeSelect.Field
							value={node.data.requestId ?? ''}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
								const value = e.target.value;
								dispatch(
									workflowActions.updateNodeData({
										id: workflowId,
										nodeId: node.id,
										data: { requestId: value === '' ? null : value },
									}),
								);
							}}
						>
							<option value=''>{'— select a request —'}</option>
							{requests.map(r => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
					{requests.length === 0 && <HelperText>{'No requests in this project yet.'}</HelperText>}
				</Stack>

				{linked && verb && (
					<Flex
						align='center'
						gap='2'
						px='2'
						py='1.5'
						borderRadius='sm'
						bg='bg.subtle'
						borderWidth='1px'
						borderColor='border.subtle'
					>
						<VerbPill verb={verb} />
						<Box flex='1' minW={0} fontSize='11px' color='fg.muted' fontFamily='mono' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
							{urlPreview || '(no URL)'}
						</Box>
						<ChakraIconButton
							aria-label='Open request'
							size='xs'
							variant='ghost'
							color='fg.subtle'
							_hover={{ color: 'fg.default' }}
							onClick={() => {
								if (!linked) return;
								dispatch(changeTab({ type: 'request', payload: linked.id, temporary: false }));
							}}
						>
							<ExternalLink size={12} strokeWidth={1.8} />
						</ChakraIconButton>
					</Flex>
				)}
			</Stack>

			{linked && (
				<Tabs.Root defaultValue='headers' size='sm' variant='line'>
					<Tabs.List px='3' borderBottomWidth='1px' borderColor='border.subtle'>
						<Tabs.Trigger value='headers'>{'Headers'}</Tabs.Trigger>
						<Tabs.Trigger value='query'>{'Query'}</Tabs.Trigger>
						<Tabs.Trigger value='body'>{'Body'}</Tabs.Trigger>
						<Tabs.Trigger value='fragment'>{'Fragment'}</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value='headers' p='3'>
						<KeyValueEditor
							rows={overrides.headers}
							onChange={next => patchOverrides({ headers: Object.keys(next).length === 0 ? undefined : next })}
							namePlaceholder='Header name'
							valuePlaceholder='Value'
							addLabel='Add header'
						/>
						<OverrideHelper>{"Overrides merge over the request's headers — same name wins."}</OverrideHelper>
					</Tabs.Content>

					<Tabs.Content value='query' p='3'>
						<KeyValueEditor
							rows={overrides.query}
							onChange={next => patchOverrides({ query: Object.keys(next).length === 0 ? undefined : next })}
							namePlaceholder='Param name'
							valuePlaceholder='Value'
							addLabel='Add parameter'
						/>
						<OverrideHelper>{"Overrides merge over the request's query — same name wins."}</OverrideHelper>
					</Tabs.Content>

					<Tabs.Content value='body' p='3'>
						<BodyOverrideEditor
							value={overrides.body}
							onChange={next => patchOverrides({ body: next })}
						/>
					</Tabs.Content>

					<Tabs.Content value='fragment' p='3'>
						<FragmentEditor
							value={overrides.fragment}
							onChange={next => patchOverrides({ fragment: next })}
						/>
					</Tabs.Content>
				</Tabs.Root>
			)}
		</Stack>
	);
}

function BodyOverrideEditor({
	value,
	onChange,
}: {
	value: NonNullable<RequestOverrides['body']> | undefined;
	onChange: (next: NonNullable<RequestOverrides['body']> | undefined) => void;
}) {
	const contentType = value?.contentType ?? '';
	const text = readPlainText(value?.text);

	function update(patch: Partial<NonNullable<RequestOverrides['body']>>) {
		const next: NonNullable<RequestOverrides['body']> = { ...(value ?? {}), ...patch };
		const empty = !next.contentType && (!next.text || next.text.length === 0);
		onChange(empty ? undefined : next);
	}

	return (
		<Stack gap='3'>
			<Stack gap='1'>
				<FieldLabel>{'Content-Type'}</FieldLabel>
				<Input
					size='sm'
					placeholder='application/json'
					value={contentType}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						update({ contentType: e.target.value === '' ? undefined : e.target.value })
					}
				/>
			</Stack>
			<Stack gap='1'>
				<FieldLabel>{'Body'}</FieldLabel>
				<Textarea
					size='sm'
					rows={8}
					placeholder={`{\n  "key": "value"\n}`}
					fontFamily='mono'
					fontSize='12px'
					value={text}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						update({ text: e.target.value === '' ? undefined : [e.target.value] })
					}
				/>
			</Stack>
			<OverrideHelper>{"Overrides the linked request's body for this step only."}</OverrideHelper>
		</Stack>
	);
}

function FragmentEditor({
	value,
	onChange,
}: {
	value: unknown[] | undefined;
	onChange: (next: unknown[] | undefined) => void;
}) {
	const text = readPlainText(value);
	return (
		<Stack gap='3'>
			<Stack gap='1'>
				<FieldLabel>{'URL fragment'}</FieldLabel>
				<Flex align='center' gap='1'>
					<Box fontSize='12px' color='fg.subtle' fontFamily='mono'>{'#'}</Box>
					<Input
						size='sm'
						placeholder='section-id'
						value={text}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onChange(e.target.value === '' ? undefined : [e.target.value])
						}
					/>
				</Flex>
			</Stack>
			<OverrideHelper>{'Appended to the URL after the path + query, before the request fires.'}</OverrideHelper>
		</Stack>
	);
}

// ── Loop ─────────────────────────────────────────────────────────────────────

function LoopEditor({ workflowId, node }: { workflowId: string; node: Extract<WorkflowNode, { type: 'loop' }> }) {
	const dispatch = useDispatch();

	return (
		<Stack gap='3' px='3' py='3'>
			<Stack gap='1'>
				<FieldLabel>{'Mode'}</FieldLabel>
				<Flex gap='1'>
					<ModeButton
						active={node.data.mode === 'count'}
						onClick={() => dispatch(workflowActions.updateNodeData({ id: workflowId, nodeId: node.id, data: { mode: 'count' } }))}
					>
						{'Count'}
					</ModeButton>
					<ModeButton
						active={node.data.mode === 'forEach'}
						onClick={() => dispatch(workflowActions.updateNodeData({ id: workflowId, nodeId: node.id, data: { mode: 'forEach' } }))}
					>
						{'For each'}
					</ModeButton>
				</Flex>
			</Stack>

			{node.data.mode === 'count' ? (
				<Stack gap='1'>
					<FieldLabel>{'Iterations'}</FieldLabel>
					<Input
						size='sm'
						type='number'
						min={0}
						value={node.data.count ?? 0}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const next = Number.parseInt(e.target.value, 10);
							dispatch(
								workflowActions.updateNodeData({
									id: workflowId,
									nodeId: node.id,
									data: { count: Number.isFinite(next) && next >= 0 ? next : 0 },
								}),
							);
						}}
					/>
				</Stack>
			) : (
				<HelperText>{'For-each: bind a response array via realtime values. Editor coming soon.'}</HelperText>
			)}

			<Stack
				gap='1.5'
				p='2.5'
				borderRadius='sm'
				bg='bg.subtle'
				borderWidth='1px'
				borderColor='border.subtle'
			>
				<Flex align='center' gap='1.5' fontSize='11px' color='accent.teal'>
					<Box w='6px' h='6px' borderRadius='full' bg='currentColor' />
					<Box fontWeight='600'>{'body'}</Box>
					<Box color='fg.muted'>{'— wire one iteration back to this node’s input'}</Box>
				</Flex>
				<Flex align='center' gap='1.5' fontSize='11px' color='accent.pink'>
					<Box w='6px' h='6px' borderRadius='full' bg='currentColor' />
					<Box fontWeight='600'>{'after'}</Box>
					<Box color='fg.muted'>{'— continues once iterations end'}</Box>
				</Flex>
			</Stack>
		</Stack>
	);
}

// ── Condition ────────────────────────────────────────────────────────────────

const operatorOptions: { value: string; label: string }[] = [
	{ value: 'equals', label: 'equals' },
	{ value: 'not_equals', label: 'not equals' },
	{ value: 'contains', label: 'contains' },
	{ value: 'truthy', label: 'is truthy' },
	{ value: 'falsy', label: 'is falsy' },
];

const operatorsNeedingRight = new Set(['equals', 'not_equals', 'contains']);

function ConditionEditor({ workflowId, node }: { workflowId: string; node: Extract<WorkflowNode, { type: 'condition' }> }) {
	const dispatch = useDispatch();

	const showRight = operatorsNeedingRight.has(node.data.operator);

	function update(patch: Partial<Extract<WorkflowNode, { type: 'condition' }>['data']>) {
		dispatch(workflowActions.updateNodeData({ id: workflowId, nodeId: node.id, data: patch }));
	}

	return (
		<Stack gap='3' px='3' py='3'>
			<Stack gap='1'>
				<FieldLabel>{'Field from incoming value'}</FieldLabel>
				<Flex align='stretch' gap='0'>
					<Flex
						align='center'
						px='2'
						borderLeftRadius='sm'
						borderWidth='1px'
						borderRightWidth='0'
						borderColor='border.default'
						bg='bg.subtle'
						color='fg.subtle'
						fontFamily='mono'
						fontSize='11px'
					>
						{'$.'}
					</Flex>
					<Input
						size='sm'
						borderLeftRadius='0'
						placeholder='body.user.id   (blank = whole value)'
						fontFamily='mono'
						value={node.data.leftPath ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							update({ leftPath: e.target.value === '' ? undefined : e.target.value })
						}
					/>
				</Flex>
				<HelperText>{'Dot path into the upstream node’s output. Leave blank to compare the value as-is.'}</HelperText>
			</Stack>

			<Stack gap='1'>
				<FieldLabel>{'Operator'}</FieldLabel>
				<NativeSelect.Root size='sm'>
					<NativeSelect.Field
						value={node.data.operator}
						onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
							update({ operator: e.target.value as Extract<WorkflowNode, { type: 'condition' }>['data']['operator'] })
						}
					>
						{operatorOptions.map(o => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>
			</Stack>

			{showRight && (
				<Stack gap='1'>
					<FieldLabel>{'Compare against'}</FieldLabel>
					<VariableInputBox
						parts={(node.data.right ?? []) as ValueSections}
						placeholder='value, or insert a variable'
						onChange={next => update({ right: next.length === 0 ? undefined : next })}
					/>
					<HelperText>{'Plain text or variable chips (type $ for the variable picker).'}</HelperText>
				</Stack>
			)}
		</Stack>
	);
}

/**
 * Bordered chrome around VariableInput so it visually matches the other form
 * inputs in the panel. VariableInput itself renders a bare contentEditable.
 */
const VariableInputBox: React.FC<{
	parts: ValueSections;
	placeholder?: string;
	onChange: (next: ValueSections) => void;
}> = ({ parts, placeholder, onChange }) => (
	<Box
		px='2'
		py='1.5'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.default'
		bg='bg.canvas'
		fontSize='12px'
		_focusWithin={{ borderColor: 'accent.pink', boxShadow: '0 0 0 1px var(--beak-colors-accent-pink)' }}
	>
		<VariableInput parts={parts} placeholder={placeholder} onChange={onChange} />
	</Box>
);

// ── Notification ─────────────────────────────────────────────────────────────

function NotificationEditor({ workflowId, node }: { workflowId: string; node: Extract<WorkflowNode, { type: 'notification' }> }) {
	const dispatch = useDispatch();

	const titleText = readPlainText(node.data.title);
	const bodyText = readPlainText(node.data.body);

	return (
		<Stack gap='3' px='3' py='3'>
			<Stack gap='1'>
				<FieldLabel>{'Title'}</FieldLabel>
				<Input
					size='sm'
					placeholder='Step complete'
					value={titleText}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						dispatch(
							workflowActions.updateNodeData({
								id: workflowId,
								nodeId: node.id,
								data: { title: e.target.value === '' ? [] : [e.target.value] },
							}),
						)
					}
				/>
			</Stack>
			<Stack gap='1'>
				<FieldLabel>{'Body'}</FieldLabel>
				<Textarea
					size='sm'
					rows={5}
					placeholder='Details to show the user…'
					value={bodyText}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						dispatch(
							workflowActions.updateNodeData({
								id: workflowId,
								nodeId: node.id,
								data: { body: e.target.value === '' ? [] : [e.target.value] },
							}),
						)
					}
				/>
			</Stack>
			<HelperText>{'Plain text only for now. Realtime-value templating lands with the loops/conditions editor pass.'}</HelperText>
		</Stack>
	);
}

// ── Bits ─────────────────────────────────────────────────────────────────────

const FieldLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
		{children}
	</Box>
);

const HelperText: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box fontSize='11px' color='fg.subtle' lineHeight='1.5'>
		{children}
	</Box>
);

const OverrideHelper: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box mt='2' fontSize='10px' color='fg.subtle' lineHeight='1.5' fontStyle='italic'>
		{children}
	</Box>
);

const VerbPill: React.FC<{ verb: string }> = ({ verb }) => (
	<Box
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		minW='42px'
		h='18px'
		px='1.5'
		borderRadius='sm'
		fontSize='9px'
		fontWeight='700'
		letterSpacing='0.04em'
		color='fg.onAccent'
		bg={verbToColor(verb)}
	>
		{verbToShortLabel(verb)}
	</Box>
);

const TinyIconButton: React.FC<React.PropsWithChildren<{ ariaLabel: string; onClick: () => void }>> = ({ ariaLabel, onClick, children }) => (
	<Button
		type='button'
		aria-label={ariaLabel}
		variant='ghost'
		size='xs'
		minW='22px'
		w='22px'
		h='22px'
		p='0'
		color='fg.muted'
		_hover={{ color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
		onClick={onClick}
	>
		{children}
	</Button>
);

const ModeButton: React.FC<React.PropsWithChildren<{ active: boolean; onClick: () => void }>> = ({ active, onClick, children }) => (
	<Button
		type='button'
		size='xs'
		variant={active ? 'solid' : 'outline'}
		colorPalette={active ? 'pink' : 'gray'}
		onClick={onClick}
	>
		{children}
	</Button>
);

function readPlainText(value: unknown): string {
	// Workflow value-sections are an array of string-or-RTV-object parts. The
	// editors here only write plain strings for now, so we round-trip safely as
	// long as every part is a string. RTV-typed parts collapse to "" here — the
	// realtime-values editor pass replaces this reader with one that renders
	// inline RTV chips.
	if (!Array.isArray(value)) return '';
	return value.filter((v): v is string => typeof v === 'string').join('');
}

function previewValueSections(parts: unknown[] | undefined): string {
	if (!parts) return '';
	return parts
		.map(p => {
			if (typeof p === 'string') return p;
			return '{var}';
		})
		.join('');
}

function kindLabel(kind: WorkflowNode['type']): string {
	switch (kind) {
		case 'start':
			return 'Start';
		case 'request':
			return 'Request';
		case 'loop':
			return 'Loop';
		case 'condition':
			return 'Condition';
		case 'notification':
			return 'Notification';
	}
}

export default NodePropertiesPanel;
