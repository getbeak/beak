import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import { projectTree } from '@beak/state';
import {
	findSourcesOf,
	findTargetsOf,
	mergeJson,
	mergeKv,
	type OverrideEntry,
	previewValueSections,
	pruneBody,
	pruneOverrideMap,
	pruneOverrides,
	type RequestOverrides,
	readPlainText,
	type WorkflowNode,
} from '@beak/state/workflows';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import JsonEditor from '@beak/ui/features/json-editor/components/JsonEditor';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import {
	Box,
	Button,
	IconButton as ChakraIconButton,
	Flex,
	Input,
	NativeSelect,
	Stack,
	Tabs,
	Textarea,
} from '@chakra-ui/react';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { ToggleKeyValue } from '@getbeak/types/request';
import type { ValueSections } from '@getbeak/types/values';
import { ExternalLink, Play, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

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
					<TinyIconButton
						ariaLabel='Delete node'
						onClick={() => dispatch(workflowActions.removeNode({ id: workflowId, nodeId: node.id }))}
					>
						<Trash2 size={13} strokeWidth={1.8} />
					</TinyIconButton>
				)}
				<TinyIconButton ariaLabel='Close panel' onClick={onClose}>
					<X size={14} strokeWidth={1.8} />
				</TinyIconButton>
			</Flex>

			<Box flex='1' minH={0} overflowY='auto'>
				<Box px='3' pt='3'>
					<Input
						size='sm'
						placeholder={defaultLabelFor(node)}
						value={(node as { name?: string }).name ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							dispatch(workflowActions.renameNode({ id: workflowId, nodeId: node.id, name: e.target.value || undefined }))
						}
					/>
				</Box>
				<ConnectionsSummary workflowId={workflowId} nodeId={node.id} />
				<NodeBody workflowId={workflowId} node={node} />
			</Box>
		</Flex>
	);
};

function defaultLabelFor(node: WorkflowNode): string {
	switch (node.type) {
		case 'start':
			return 'Start';
		case 'request':
			return 'Request step';
		case 'loop':
			return 'Loop step';
		case 'condition':
			return 'Condition step';
		case 'notification':
			return 'Notification step';
		case 'comment':
			return 'Note';
	}
}

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
		case 'comment':
			return <CommentEditor workflowId={workflowId} node={node} />;
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
				{
					'Every workflow begins here. Connect this node’s output to the first step you want to run. Exactly one start node per workflow.'
				}
			</HelperText>
		</Stack>
	);
}

// ── Request ──────────────────────────────────────────────────────────────────

/**
 * Workflow request-node editor. Reuses the same `BasicTableEditor` /
 * `JsonEditor` the request pane mounts, but in `valuesOnly` mode so the
 * schema (key names, types, required, descriptions) stays locked to whatever
 * the linked request declares. The user only edits *values* and the per-row
 * enabled toggle (and only for non-required rows). Edits land in the
 * workflow's per-step override map, keyed by the linked entry's id.
 */
function RequestEditor({ workflowId, node }: { workflowId: string; node: Extract<WorkflowNode, { type: 'request' }> }) {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const linked = useAppSelector(s => {
		if (!node.data.requestId) return undefined;
		const t = s.global.project.tree[node.data.requestId];
		return t?.type === 'request' ? t : undefined;
	});

	const requests = useMemo(
		() => projectTree.filterByType(tree, 'request').sort((a, b) => a.name.localeCompare(b.name)),
		[tree],
	);

	const overrides: RequestOverrides = node.data.overrides ?? {};

	const writeOverrides = useCallback(
		(next: RequestOverrides) => {
			dispatch(
				workflowActions.updateNodeData({
					id: workflowId,
					nodeId: node.id,
					data: { overrides: pruneOverrides(next) },
				}),
			);
		},
		[dispatch, workflowId, node.id],
	);

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
						<Box
							flex='1'
							minW={0}
							fontSize='11px'
							color='fg.muted'
							fontFamily='mono'
							whiteSpace='nowrap'
							overflow='hidden'
							textOverflow='ellipsis'
						>
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
								dispatch(changeTab({ type: 'request', payload: linked.id, temporary: true }));
							}}
						>
							<ExternalLink size={12} strokeWidth={1.8} />
						</ChakraIconButton>
					</Flex>
				)}
			</Stack>

			{linked && linked.mode === 'valid' && (
				<Tabs.Root defaultValue='headers' size='sm' variant='line'>
					<Tabs.List px='3' borderBottomWidth='1px' borderColor='border.subtle'>
						<Tabs.Trigger value='headers'>{'Headers'}</Tabs.Trigger>
						<Tabs.Trigger value='query'>{'Query'}</Tabs.Trigger>
						<Tabs.Trigger value='body'>{'Body'}</Tabs.Trigger>
						<Tabs.Trigger value='fragment'>{'Fragment'}</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value='headers' p='3'>
						<KvOverrideEditor
							linked={linked.info.headers}
							overrides={overrides.headers}
							onChange={next => writeOverrides({ ...overrides, headers: next })}
						/>
						<OverrideHelper>{'Override values for this step only — the linked request owns the schema.'}</OverrideHelper>
					</Tabs.Content>

					<Tabs.Content value='query' p='3'>
						<KvOverrideEditor
							linked={linked.info.query}
							overrides={overrides.query}
							onChange={next => writeOverrides({ ...overrides, query: next })}
						/>
						<OverrideHelper>{'Override values for this step only — the linked request owns the schema.'}</OverrideHelper>
					</Tabs.Content>

					<Tabs.Content value='body' p='3'>
						<BodyOverrideTab
							linked={linked}
							overrides={overrides.body}
							onChange={next => writeOverrides({ ...overrides, body: next })}
						/>
					</Tabs.Content>

					<Tabs.Content value='fragment' p='3'>
						<FragmentEditor value={overrides.fragment} onChange={next => writeOverrides({ ...overrides, fragment: next })} />
					</Tabs.Content>
				</Tabs.Root>
			)}
		</Stack>
	);
}

// ── Header/Query override editor ────────────────────────────────────────────

/**
 * Reuse `BasicTableEditor` in `valuesOnly` mode for header + query overrides.
 * Linked rows are merged with overrides at render time so the table shows the
 * linked schema with override values overlaid; edits write back into the
 * keyed override map. Schema-side updates (name, type, required, etc.)
 * never reach this component — `valuesOnly` locks the affordances.
 */
function KvOverrideEditor({
	linked,
	overrides,
	onChange,
}: {
	linked: Record<string, ToggleKeyValue>;
	overrides: Record<string, OverrideEntry> | undefined;
	onChange: (next: Record<string, OverrideEntry> | undefined) => void;
}) {
	const merged = useMemo(() => mergeKv(linked, overrides), [linked, overrides]);

	function patchOverride(id: string, patch: Partial<OverrideEntry>) {
		const current = overrides?.[id] ?? {};
		const updated: OverrideEntry = { ...current, ...patch };
		const next: Record<string, OverrideEntry> = { ...(overrides ?? {}), [id]: updated };
		onChange(pruneOverrideMap(next));
	}

	if (Object.keys(linked).length === 0) {
		return <HelperText>{'No fields declared on the linked request — nothing to override here.'}</HelperText>;
	}

	return (
		<BasicTableEditor
			items={merged}
			valuesOnly
			updateItem={(type, id, value) => {
				if (type === 'value') patchOverride(id, { value });
				else if (type === 'enabled') patchOverride(id, { enabled: value as boolean });
				// Other fields (name/type/required/...) belong to the linked schema
				// and can't be reached from this UI; ignore if they somehow fire.
			}}
		/>
	);
}

// ── Body override tab ───────────────────────────────────────────────────────

/**
 * Dispatches on the linked body type to render the appropriate values-only
 * editor. JSON bodies get the structured `JsonEditor`, url-encoded forms get
 * the `BasicTableEditor`, and opaque bodies (text, json_raw) fall back to a
 * full-payload textarea (since there's no schema to overlay against). gRPC /
 * file / GraphQL bodies are noted as not-yet-supported for v1.
 */
function BodyOverrideTab({
	linked,
	overrides,
	onChange,
}: {
	linked: ValidRequestNode;
	overrides: RequestOverrides['body'];
	onChange: (next: RequestOverrides['body']) => void;
}) {
	const body = linked.info.body;

	if (body.type === 'json') {
		return (
			<JsonBodyOverrideEditor
				requestId={linked.id}
				linked={body.payload}
				overrides={overrides?.fields}
				onChange={nextFields => onChange(pruneBody({ ...(overrides ?? {}), fields: nextFields }))}
			/>
		);
	}

	if (body.type === 'url_encoded_form') {
		return (
			<KvOverrideEditor
				linked={body.payload}
				overrides={overrides?.fields}
				onChange={nextFields => onChange(pruneBody({ ...(overrides ?? {}), fields: nextFields }))}
			/>
		);
	}

	if (body.type === 'text' || body.type === 'json_raw') {
		return (
			<RawBodyOverrideEditor
				linkedPayload={body.payload}
				value={overrides?.raw}
				onChange={nextRaw => onChange(pruneBody({ ...(overrides ?? {}), raw: nextRaw }))}
			/>
		);
	}

	return (
		<HelperText>
			{`Body overrides for "${body.type}" bodies are coming in a follow-up. The linked request's body fires as-is.`}
		</HelperText>
	);
}

/**
 * Reuses `JsonEditor` in `valuesOnly` mode for the JSON body. Merges the
 * linked EntryMap with the per-step overrides on every render, and provides
 * custom action creators so value/enabled writes land in the workflow's
 * override slice instead of the project slice.
 */
function JsonBodyOverrideEditor({
	requestId,
	linked,
	overrides,
	onChange,
}: {
	requestId: string;
	linked: EntryMap;
	overrides: Record<string, OverrideEntry> | undefined;
	onChange: (next: Record<string, OverrideEntry> | undefined) => void;
}) {
	const merged = useMemo(() => mergeJson(linked, overrides), [linked, overrides]);

	const patchOverride = useCallback(
		(id: string, patch: Partial<OverrideEntry>) => {
			const current = overrides?.[id] ?? {};
			const updated: OverrideEntry = { ...current, ...patch };
			const next: Record<string, OverrideEntry> = { ...(overrides ?? {}), [id]: updated };
			onChange(pruneOverrideMap(next));
		},
		[overrides, onChange],
	);

	// JsonEditor expects each action creator to take a payload and return an
	// AnyAction. Wrap our patch-and-dispatch in lightweight thunks that return
	// a workflow `updateNodeData` action — using the underlying writeOverrides
	// path through the parent's onChange so we don't double up dispatches.
	const valueChanged = useCallback(
		(payload: { id: string; value: unknown }) => {
			patchOverride(payload.id, { value: payload.value });
			// Return a noop action — the dispatch has already happened above.
			return { type: 'workflows/_noop' } as const;
		},
		[patchOverride],
	);
	const enabledChanged = useCallback(
		(payload: { id: string; enabled: boolean }) => {
			patchOverride(payload.id, { enabled: payload.enabled });
			return { type: 'workflows/_noop' } as const;
		},
		[patchOverride],
	);

	if (Object.keys(linked).length === 0) {
		return <HelperText>{'No JSON body fields on the linked request — nothing to override.'}</HelperText>;
	}

	return (
		<JsonEditor
			requestId={requestId}
			value={merged}
			valuesOnly
			editorSelector={() => merged}
			// Schema-mutation handlers are unreachable in valuesOnly mode but
			// JsonEditor still requires the slots — point them at a noop to
			// keep redux quiet if the UI somehow surfaces them.
			valueChanged={valueChanged}
			enabledChanged={enabledChanged}
		/>
	);
}

/**
 * Free-form raw-body override for `text` and `json_raw` linked bodies. Shows
 * the linked payload as a faint placeholder so the user knows what they're
 * replacing — typing into the textarea writes the full override payload, and
 * clearing it removes the override (the linked body fires unchanged).
 */
function RawBodyOverrideEditor({
	linkedPayload,
	value,
	onChange,
}: {
	linkedPayload: string;
	value: NonNullable<RequestOverrides['body']>['raw'];
	onChange: (next: NonNullable<RequestOverrides['body']>['raw']) => void;
}) {
	const contentType = value?.contentType ?? '';
	const text = readPlainText(value?.text);

	function update(patch: Partial<NonNullable<NonNullable<RequestOverrides['body']>['raw']>>) {
		const next = { ...(value ?? {}), ...patch };
		const empty = !next.contentType && (!next.text || next.text.length === 0);
		onChange(empty ? undefined : next);
	}

	return (
		<Stack gap='3'>
			<Stack gap='1'>
				<FieldLabel>{'Content-Type override'}</FieldLabel>
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
				<FieldLabel>{'Body override'}</FieldLabel>
				<Textarea
					size='sm'
					rows={8}
					placeholder={linkedPayload || '// blank — leave empty to pass the linked body through'}
					fontFamily='mono'
					fontSize='12px'
					value={text}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						update({ text: e.target.value === '' ? undefined : [e.target.value] })
					}
				/>
			</Stack>
			<OverrideHelper>
				{'Opaque body types have no schema to overlay — the override replaces the whole payload for this step.'}
			</OverrideHelper>
		</Stack>
	);
}

// ── Override map plumbing ───────────────────────────────────────────────────

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
					<Box fontSize='12px' color='fg.subtle' fontFamily='mono'>
						{'#'}
					</Box>
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
						onClick={() =>
							dispatch(workflowActions.updateNodeData({ id: workflowId, nodeId: node.id, data: { mode: 'count' } }))
						}
					>
						{'Count'}
					</ModeButton>
					<ModeButton
						active={node.data.mode === 'forEach'}
						onClick={() =>
							dispatch(workflowActions.updateNodeData({ id: workflowId, nodeId: node.id, data: { mode: 'forEach' } }))
						}
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

			<Stack gap='1.5' p='2.5' borderRadius='sm' bg='bg.subtle' borderWidth='1px' borderColor='border.subtle'>
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

function ConditionEditor({
	workflowId,
	node,
}: {
	workflowId: string;
	node: Extract<WorkflowNode, { type: 'condition' }>;
}) {
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

function NotificationEditor({
	workflowId,
	node,
}: {
	workflowId: string;
	node: Extract<WorkflowNode, { type: 'notification' }>;
}) {
	const dispatch = useDispatch();

	return (
		<Stack gap='3' px='3' py='3'>
			<Stack gap='1'>
				<FieldLabel>{'Title'}</FieldLabel>
				<VariableInputBox
					parts={(node.data.title ?? []) as ValueSections}
					placeholder='Step complete'
					onChange={next =>
						dispatch(
							workflowActions.updateNodeData({
								id: workflowId,
								nodeId: node.id,
								data: { title: next.length === 0 ? [] : next },
							}),
						)
					}
				/>
			</Stack>
			<Stack gap='1'>
				<FieldLabel>{'Body'}</FieldLabel>
				<VariableInputBox
					parts={(node.data.body ?? []) as ValueSections}
					placeholder='Details to show the user…'
					onChange={next =>
						dispatch(
							workflowActions.updateNodeData({
								id: workflowId,
								nodeId: node.id,
								data: { body: next.length === 0 ? [] : next },
							}),
						)
					}
				/>
			</Stack>
			<HelperText>{'Type $ to insert a variable chip — works the same way as request headers/body.'}</HelperText>
		</Stack>
	);
}

// ── Comment ──────────────────────────────────────────────────────────────────

function CommentEditor({
	workflowId,
	node,
}: {
	workflowId: string;
	node: Extract<WorkflowNode, { type: 'comment' }>;
}) {
	const dispatch = useDispatch();
	return (
		<Stack gap='3' px='3' py='3'>
			<Stack gap='1'>
				<FieldLabel>{'Note'}</FieldLabel>
				<Textarea
					size='sm'
					rows={8}
					placeholder='Document this section of the workflow…'
					value={node.data.text ?? ''}
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
						dispatch(
							workflowActions.updateNodeData({
								id: workflowId,
								nodeId: node.id,
								data: { text: e.target.value === '' ? undefined : e.target.value },
							}),
						)
					}
				/>
			</Stack>
			<HelperText>
				{
					'Comments are pure documentation. They have no inputs or outputs and never run — they ride along with the workflow file so your notes round-trip with the graph.'
				}
			</HelperText>
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

const TinyIconButton: React.FC<React.PropsWithChildren<{ ariaLabel: string; onClick: () => void }>> = ({
	ariaLabel,
	onClick,
	children,
}) => (
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

const ModeButton: React.FC<React.PropsWithChildren<{ active: boolean; onClick: () => void }>> = ({
	active,
	onClick,
	children,
}) => (
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
		case 'comment':
			return 'Comment';
	}
}

/**
 * Compact "Inbound · Outbound" chip row above the kind-specific editor.
 * Reads `findSourcesOf` + `findTargetsOf` against the live slice so the
 * counts stay in lockstep with drag/drop wiring.
 */
function ConnectionsSummary({ workflowId, nodeId }: { workflowId: string; nodeId: string }) {
	const workflow = useAppSelector(s => s.global.workflows.workflows[workflowId]);
	if (!workflow) return null;
	const sources = findSourcesOf(workflow, nodeId);
	const targets = findTargetsOf(workflow, nodeId);
	if (sources.length === 0 && targets.length === 0) return null;

	return (
		<Flex
			align='center'
			gap='1.5'
			mt='2'
			mx='3'
			px='2'
			py='1'
			borderRadius='sm'
			bg='bg.subtle'
			borderWidth='1px'
			borderColor='border.subtle'
			fontSize='10px'
			color='fg.muted'
			fontWeight='600'
		>
			<Box>
				{`Inbound ${sources.length} · Outbound ${targets.length}`}
			</Box>
		</Flex>
	);
}

export default NodePropertiesPanel;
