import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import ksuid from '@beak/ksuid';
import {
	inspectGraph,
	overrideBadgeText,
	placeNewNode,
	previewValueSections,
	type RequestOverrides,
	type WorkflowEdge,
	type WorkflowNode,
	type WorkflowNodeKind,
} from '@beak/state/workflows';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, Flex, Input, Stack } from '@chakra-ui/react';
import type { RequestNode as ProjectRequestNode } from '@getbeak/types/nodes';
import {
	addEdge as addRfEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	Handle,
	MiniMap,
	type Node,
	type NodeChange,
	type NodeProps,
	Position,
	ReactFlow,
	ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, Bell, GitBranch, Globe, Play, Repeat, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import NodePropertiesPanel from './NodePropertiesPanel';

interface WorkflowEditorProps {
	workflowId: string;
}

/**
 * Visual workflow builder. Reads the workflow graph from Redux as the source
 * of truth and pushes every xyflow change back via `replaceGraph`. The
 * debounced write effect flushes to disk; the slice already cascade-deletes
 * orphaned edges.
 */
const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflowId }) => {
	const exists = useAppSelector(s => Boolean(s.global.workflows.workflows[workflowId]));

	if (!exists) {
		return (
			<Flex h='100%' align='center' justify='center' direction='column' gap='2' color='fg.subtle'>
				<Box fontSize='sm'>{'Workflow not found'}</Box>
			</Flex>
		);
	}

	return (
		<ReactFlowProvider>
			<WorkflowEditorInner workflowId={workflowId} />
		</ReactFlowProvider>
	);
};

const nodeTypes = {
	start: StartNodeView,
	request: RequestNodeView,
	loop: LoopNodeView,
	condition: ConditionNodeView,
	notification: NotificationNodeView,
};

type AddableNodeKind = Exclude<WorkflowNodeKind, 'start'>;

const WorkflowEditorInner: React.FC<WorkflowEditorProps> = ({ workflowId }) => {
	const workflow = useAppSelector(s => s.global.workflows.workflows[workflowId]);
	const dispatch = useDispatch();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	// xyflow's controlled API takes `Node[]` / `Edge[]`. Our schema is structurally
	// compatible — we cast through `unknown` because xyflow's generic Node has an
	// open `data` record and ours is a discriminated union.
	const rfNodes = useMemo<Node[]>(() => (workflow ? (workflow.nodes as unknown as Node[]) : []), [workflow]);
	const rfEdges = useMemo<Edge[]>(() => (workflow ? (workflow.edges as unknown as Edge[]) : []), [workflow]);

	const selectedNode = useMemo(() => {
		if (!workflow || !selectedNodeId) return undefined;
		return workflow.nodes.find(n => n.id === selectedNodeId);
	}, [workflow, selectedNodeId]);

	const health = useMemo(() => (workflow ? inspectGraph(workflow) : null), [workflow]);
	const warningCount = health ? health.unreachable.length + health.unlinkedRequestNodes.length : 0;

	// Keyboard: Delete/Backspace removes the selected node (unless it's Start),
	// Escape clears selection. Skip when focus is inside a text field so the
	// properties panel and toolbar inputs keep their native behaviour.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			const tag = target?.tagName;
			const isEditable =
				tag === 'INPUT' ||
				tag === 'TEXTAREA' ||
				tag === 'SELECT' ||
				(target?.isContentEditable ?? false);
			if (isEditable) return;

			if (event.key === 'Escape') {
				if (selectedNodeId) {
					event.preventDefault();
					setSelectedNodeId(null);
				}
				return;
			}

			if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId && selectedNode) {
				if (selectedNode.type === 'start') return;
				event.preventDefault();
				dispatch(workflowActions.removeNode({ id: workflowId, nodeId: selectedNodeId }));
				setSelectedNodeId(null);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dispatch, selectedNode, selectedNodeId, workflowId]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			if (!workflow) return;
			const next = applyNodeChanges(changes, rfNodes) as unknown as WorkflowNode[];
			dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: next, edges: workflow.edges }));
		},
		[dispatch, rfNodes, workflow, workflowId],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			if (!workflow) return;
			const next = applyEdgeChanges(changes, rfEdges) as unknown as WorkflowEdge[];
			dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: workflow.nodes, edges: next }));
		},
		[dispatch, rfEdges, workflow, workflowId],
	);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (!workflow) return;
			const next = addRfEdge(connection, rfEdges) as unknown as WorkflowEdge[];
			// xyflow's `addEdge` synthesises ids on its own; we replace them with a
			// ksuid so the dedupe-by-id check in `addEdge` reducer is meaningful.
			const enriched = next.map(e => (e.id?.startsWith('xy-edge__') ? { ...e, id: ksuid.generate('edge').toString() } : e));
			dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: workflow.nodes, edges: enriched }));
		},
		[dispatch, rfEdges, workflow, workflowId],
	);

	if (!workflow) return null;

	function addNode(kind: AddableNodeKind) {
		const id = ksuid.generate('node').toString();
		const position = placeNewNode(workflow.nodes);
		let node: WorkflowNode;
		switch (kind) {
			case 'request':
				node = { id, type: 'request', position, data: { requestId: null } };
				break;
			case 'loop':
				node = { id, type: 'loop', position, data: { mode: 'count', count: 3 } };
				break;
			case 'condition':
				node = { id, type: 'condition', position, data: { operator: 'truthy' } };
				break;
			case 'notification':
				node = { id, type: 'notification', position, data: {} };
				break;
		}
		dispatch(workflowActions.addNode({ id: workflowId, node }));
	}

	return (
		<Flex direction='column' h='100%' bg='bg.canvas' minH={0}>
			<Flex
				align='center'
				gap='2'
				px='3'
				py='2'
				flexShrink={0}
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
			>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
					color='accent.pink'
					flex='0 0 auto'
				>
					<WorkflowIcon size={11} strokeWidth={2.2} />
				</Flex>
				<Input
					size='xs'
					variant='outline'
					value={workflow.name}
					maxW='280px'
					h='24px'
					fontSize='12px'
					fontWeight='600'
					color='fg.default'
					borderColor='transparent'
					bg='transparent'
					px='1.5'
					_hover={{ borderColor: 'border.subtle' }}
					_focus={{ borderColor: 'accent.pink', bg: 'bg.surface' }}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						dispatch(workflowActions.updateWorkflowName({ id: workflowId, name: e.target.value }));
					}}
				/>
				<Flex align='center' gap='1.5' ml='2' color='fg.subtle' fontSize='10px' fontWeight='600'>
					<MetaPill icon={<Globe size={10} strokeWidth={2.2} />} count={workflow.nodes.length} label='steps' />
					<MetaPill icon={<GitBranch size={10} strokeWidth={2.2} />} count={workflow.edges.length} label='links' />
					{warningCount > 0 && (
						<WarningPill
							count={warningCount}
							label={warningCount === 1 ? 'issue' : 'issues'}
							title={
								health
									? [
										health.unreachable.length > 0 ? `${health.unreachable.length} unreachable` : null,
										health.unlinkedRequestNodes.length > 0 ? `${health.unlinkedRequestNodes.length} unlinked` : null,
									]
											.filter(Boolean)
											.join(' · ')
									: undefined
							}
						/>
					)}
				</Flex>

				<Box flex='1 1 auto' />

				<Stack direction='row' gap='1'>
					<ToolbarButton icon={<Globe size={13} strokeWidth={1.8} />} label='Request' onClick={() => addNode('request')} />
					<ToolbarButton icon={<Repeat size={13} strokeWidth={1.8} />} label='Loop' onClick={() => addNode('loop')} />
					<ToolbarButton
						icon={<GitBranch size={13} strokeWidth={1.8} />}
						label='Condition'
						onClick={() => addNode('condition')}
					/>
					<ToolbarButton
						icon={<Bell size={13} strokeWidth={1.8} />}
						label='Notification'
						onClick={() => addNode('notification')}
					/>
				</Stack>
			</Flex>
			<Flex flex='1' minH={0}>
				<Box flex='1' minW={0}>
					<ReactFlow
						nodes={rfNodes}
						edges={rfEdges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
						onPaneClick={() => setSelectedNodeId(null)}
						nodeTypes={nodeTypes}
						fitView
						proOptions={{ hideAttribution: true }}
					>
						<Background gap={20} size={1} />
						<MiniMap pannable zoomable />
						<Controls />
					</ReactFlow>
				</Box>
				{selectedNode ? (
					<NodePropertiesPanel
						workflowId={workflowId}
						node={selectedNode}
						onClose={() => setSelectedNodeId(null)}
					/>
				) : (
					<EmptySelectionPanel
						addNode={addNode}
						unreachableCount={health?.unreachable.length ?? 0}
						unlinkedCount={health?.unlinkedRequestNodes.length ?? 0}
					/>
				)}
			</Flex>
		</Flex>
	);
};

interface MetaPillProps {
	icon: React.ReactNode;
	count: number;
	label: string;
}

// Mirrors the variable-set editor's header pill so the two surfaces feel
// like siblings rather than two different visual languages.
const MetaPill: React.FC<MetaPillProps> = ({ icon, count, label }) => (
	<Flex
		align='center'
		gap='1'
		px='1.5'
		h='18px'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.canvas'
		color='fg.subtle'
		fontVariantNumeric='tabular-nums'
	>
		{icon}
		<Box as='span'>{count}</Box>
		<Box as='span' color='fg.muted'>
			{label}
		</Box>
	</Flex>
);

// Amber pill that appears when the graph picks up unreachable steps or
// unlinked request nodes — same shape as MetaPill so the two read as a row.
const WarningPill: React.FC<{ count: number; label: string; title?: string }> = ({ count, label, title }) => (
	<Flex
		align='center'
		gap='1'
		px='1.5'
		h='18px'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 38%, transparent)'
		bg='color-mix(in srgb, var(--beak-colors-accent-warning) 14%, transparent)'
		color='accent.warning'
		fontVariantNumeric='tabular-nums'
		title={title}
	>
		<AlertTriangle size={10} strokeWidth={2.2} />
		<Box as='span'>{count}</Box>
		<Box as='span' opacity={0.85}>
			{label}
		</Box>
	</Flex>
);

interface EmptySelectionPanelProps {
	addNode: (kind: AddableNodeKind) => void;
	unreachableCount: number;
	unlinkedCount: number;
}

// Shown on the right when nothing's selected — gives the canvas an obvious
// "what next" instead of empty space. Buttons fire the same toolbar handlers
// so the user has one entry point for adding nodes regardless of focus.
const EmptySelectionPanel: React.FC<EmptySelectionPanelProps> = ({ addNode, unreachableCount, unlinkedCount }) => {
	const items: { kind: AddableNodeKind; icon: React.ReactNode; title: string; subtitle: string; tone: string }[] = [
		{
			kind: 'request',
			icon: <Globe size={14} strokeWidth={1.8} />,
			title: 'Request',
			subtitle: 'Run a linked request with per-step overrides.',
			tone: 'pink',
		},
		{
			kind: 'loop',
			icon: <Repeat size={14} strokeWidth={1.8} />,
			title: 'Loop',
			subtitle: 'Repeat the inner branch N times or for each item.',
			tone: 'teal',
		},
		{
			kind: 'condition',
			icon: <GitBranch size={14} strokeWidth={1.8} />,
			title: 'Condition',
			subtitle: 'Branch on a value — true/false outputs.',
			tone: 'indigo',
		},
		{
			kind: 'notification',
			icon: <Bell size={14} strokeWidth={1.8} />,
			title: 'Notification',
			subtitle: 'Fire a desktop notification at this step.',
			tone: 'warning',
		},
	];
	return (
		<Flex
			direction='column'
			w='320px'
			flexShrink={0}
			bg='bg.surface'
			borderLeftWidth='1px'
			borderColor='border.subtle'
			minH={0}
			overflowY='auto'
		>
			<Box px='3' py='3' borderBottomWidth='1px' borderColor='border.subtle'>
				<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
					{'Add a step'}
				</Box>
				<Box mt='1' fontSize='11px' color='fg.subtle' lineHeight='1.5'>
					{'Click a node to edit its details. Or add a new step from below — it lands next to your existing work.'}
				</Box>
			</Box>
			<Stack px='2' py='2' gap='1'>
				{items.map(item => (
					<Flex
						as='button'
						key={item.kind}
						role='button'
						align='flex-start'
						gap='2'
						px='2'
						py='2'
						bg='transparent'
						borderRadius='sm'
						cursor='pointer'
						textAlign='left'
						_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)' }}
						onClick={() => addNode(item.kind)}
					>
						<Flex
							align='center'
							justify='center'
							w='24px'
							h='24px'
							flexShrink={0}
							borderRadius='sm'
							color={`accent.${item.tone}`}
							bg={`color-mix(in srgb, var(--beak-colors-accent-${item.tone}) 14%, transparent)`}
						>
							{item.icon}
						</Flex>
						<Stack gap='0.5' flex='1' minW={0}>
							<Box fontSize='12px' fontWeight='600' color='fg.default'>
								{item.title}
							</Box>
							<Box fontSize='11px' color='fg.subtle' lineHeight='1.4'>
								{item.subtitle}
							</Box>
						</Stack>
					</Flex>
				))}
			</Stack>
			{(unreachableCount > 0 || unlinkedCount > 0) && (
				<Box px='3' py='3' borderTopWidth='1px' borderColor='border.subtle'>
					<Box fontSize='10px' fontWeight='700' color='accent.warning' textTransform='uppercase' letterSpacing='0.06em' mb='1.5'>
						{'Heads up'}
					</Box>
					<Stack gap='1' fontSize='11px' color='fg.subtle' lineHeight='1.5'>
						{unreachableCount > 0 && (
							<Box>{`${unreachableCount} step${unreachableCount === 1 ? '' : 's'} not connected to Start.`}</Box>
						)}
						{unlinkedCount > 0 && (
							<Box>{`${unlinkedCount} request step${unlinkedCount === 1 ? '' : 's'} missing a linked request.`}</Box>
						)}
					</Stack>
				</Box>
			)}
			<Box flex='1' />
			<Box px='3' py='2.5' borderTopWidth='1px' borderColor='border.subtle' fontSize='10px' color='fg.subtle' lineHeight='1.5'>
				<Box mb='0.5'>
					<KbdHint>Esc</KbdHint> {'clear selection'}
				</Box>
				<Box>
					<KbdHint>Delete</KbdHint> {'remove the selected step'}
				</Box>
			</Box>
		</Flex>
	);
};

const KbdHint: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box
		as='span'
		display='inline-block'
		px='1'
		mr='1'
		fontFamily='mono'
		fontSize='10px'
		fontWeight='600'
		color='fg.muted'
		bg='bg.canvas'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
	>
		{children}
	</Box>
);

const ToolbarButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
	<Flex
		as='button'
		role='button'
		align='center'
		gap='1.5'
		px='2'
		h='24px'
		fontSize='12px'
		color='fg.muted'
		bg='transparent'
		borderRadius='sm'
		cursor='pointer'
		_hover={{
			color: 'fg.default',
			bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
		}}
		onClick={onClick}
	>
		{icon}
		<Box>{label}</Box>
	</Flex>
);

interface BranchHandle {
	id: string;
	label: string;
	tone: string;
}

/**
 * Compact pill: coloured kind header + a kind-specific body. When a node has
 * multiple outbound branches (loop body/after, condition true/false) we render
 * labelled handle rows at the bottom instead of bare dots. xyflow positions
 * each Handle by its actual DOM bounds, so the row layout drives the edge
 * endpoints automatically — no fragile fixed pixel offsets.
 */
const NodeShell: React.FC<{
	tone: string;
	icon: React.ReactNode;
	title: string;
	selected?: boolean;
	noInput?: boolean;
	noOutput?: boolean;
	rightHandles?: BranchHandle[];
	children?: React.ReactNode;
}> = ({ tone, icon, title, selected, noInput, noOutput, rightHandles, children }) => (
	<Box
		minW='200px'
		maxW='260px'
		borderRadius='md'
		bg='bg.surface'
		borderWidth='1px'
		borderColor={selected ? `accent.${tone}` : 'border.default'}
		boxShadow={selected ? `0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-${tone}) 28%, transparent)` : 'sm'}
		fontSize='12px'
		color='fg.default'
		position='relative'
		transition='border-color .12s ease, box-shadow .12s ease'
	>
		{!noInput && <Handle type='target' position={Position.Left} />}
		<Flex
			align='center'
			gap='2'
			px='2.5'
			py='1.5'
			borderTopRadius='md'
			bg={`color-mix(in srgb, var(--beak-colors-accent-${tone}) 16%, transparent)`}
			color={`accent.${tone}`}
		>
			{icon}
			<Box fontWeight='600' fontSize='11px' textTransform='uppercase' letterSpacing='0.04em'>
				{title}
			</Box>
		</Flex>
		{children}
		{rightHandles && rightHandles.length > 0 && (
			<Box borderTopWidth='1px' borderColor='border.subtle'>
				{rightHandles.map(h => (
					<Box
						key={h.id}
						position='relative'
						px='2.5'
						py='1.5'
						_notLast={{ borderBottomWidth: '1px', borderColor: 'border.subtle' }}
					>
						<Flex align='center' gap='1.5' justify='flex-end' fontSize='10px' fontWeight='600' color={`accent.${h.tone}`}>
							<Box w='5px' h='5px' borderRadius='full' bg='currentColor' />
							{h.label}
						</Flex>
						<Handle id={h.id} type='source' position={Position.Right} />
					</Box>
				))}
			</Box>
		)}
		{!rightHandles && !noOutput && <Handle type='source' position={Position.Right} />}
	</Box>
);

const VerbBadge: React.FC<{ verb: string }> = ({ verb }) => (
	<Box
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		minW='38px'
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

function RequestNodeView({ data, selected }: NodeProps) {
	const d = data as { requestId: string | null; overrides?: RequestOverrides };
	const linked = useAppSelector(s => {
		if (!d.requestId) return undefined;
		const node = s.global.project.tree[d.requestId];
		return node?.type === 'request' ? (node as ProjectRequestNode) : undefined;
	});

	const overrideBadge = overrideBadgeText(d.overrides);
	const verb = linked?.mode === 'valid' ? linked.info.verb : 'get';
	const urlPreview = linked?.mode === 'valid' ? previewValueSections(linked.info.url) : '';

	return (
		<NodeShell tone='pink' icon={<Globe size={12} strokeWidth={1.8} />} title='Request' selected={selected}>
			{!d.requestId ? (
				<Box px='2.5' py='2' color='fg.subtle' fontStyle='italic'>
					{'Pick a request →'}
				</Box>
			) : !linked ? (
				<Box px='2.5' py='2' color='accent.alert' fontSize='11px'>
					{'Request not found'}
				</Box>
			) : (
				<Stack gap='1' px='2.5' py='2'>
					<Flex align='center' gap='2'>
						<VerbBadge verb={verb} />
						<Box flex='1' minW={0} fontWeight='600' fontSize='12px' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
							{linked.name}
						</Box>
					</Flex>
					{urlPreview && (
						<Box fontSize='10px' color='fg.muted' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' fontFamily='mono'>
							{urlPreview}
						</Box>
					)}
					{overrideBadge && (
						<Flex
							alignSelf='flex-start'
							align='center'
							gap='1'
							mt='0.5'
							px='1.5'
							h='16px'
							borderRadius='sm'
							fontSize='9px'
							fontWeight='600'
							letterSpacing='0.04em'
							textTransform='uppercase'
							color='accent.pink'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						>
							{overrideBadge}
						</Flex>
					)}
				</Stack>
			)}
		</NodeShell>
	);
}

function StartNodeView({ selected }: NodeProps) {
	return (
		<NodeShell
			tone='success'
			icon={<Play size={12} strokeWidth={2} fill='currentColor' />}
			title='Start'
			selected={selected}
			noInput
		>
			<Box px='2.5' py='1.5' color='fg.subtle' fontSize='11px' fontStyle='italic'>
				{'Workflow entry point'}
			</Box>
		</NodeShell>
	);
}

function LoopNodeView({ data, selected }: NodeProps) {
	const d = data as { mode: 'count' | 'forEach'; count?: number };
	const subtitle = d.mode === 'count' ? `Repeat ${d.count ?? 0} ×` : 'For each item';
	return (
		<NodeShell
			tone='teal'
			icon={<Repeat size={12} strokeWidth={1.8} />}
			title='Loop'
			selected={selected}
			rightHandles={[
				{ id: 'body', label: 'body', tone: 'teal' },
				{ id: 'after', label: 'after', tone: 'pink' },
			]}
		>
			<Box px='2.5' py='2' color='fg.muted'>
				{subtitle}
			</Box>
		</NodeShell>
	);
}

const operatorLabels: Record<string, string> = {
	equals: '=',
	not_equals: '≠',
	contains: 'contains',
	truthy: 'is truthy',
	falsy: 'is falsy',
};

function ConditionNodeView({ data, selected }: NodeProps) {
	const d = data as { operator: string };
	return (
		<NodeShell
			tone='indigo'
			icon={<GitBranch size={12} strokeWidth={1.8} />}
			title='Condition'
			selected={selected}
			rightHandles={[
				{ id: 'true', label: 'true', tone: 'success' },
				{ id: 'false', label: 'false', tone: 'alert' },
			]}
		>
			<Box px='2.5' py='2' color='fg.muted'>
				{operatorLabels[d.operator] ?? d.operator}
			</Box>
		</NodeShell>
	);
}

function NotificationNodeView({ data, selected }: NodeProps) {
	const d = data as { title?: unknown[]; body?: unknown[] };
	const title = previewValueSections(d.title) || 'Untitled notification';
	return (
		<NodeShell tone='warning' icon={<Bell size={12} strokeWidth={1.8} />} title='Notification' selected={selected}>
			<Box px='2.5' py='2' color='fg.default' fontWeight='600' fontSize='12px' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
				{title}
			</Box>
		</NodeShell>
	);
}

export default WorkflowEditor;
