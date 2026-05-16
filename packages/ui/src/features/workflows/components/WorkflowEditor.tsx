import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import ksuid from '@beak/ksuid';
import type { RequestOverrides, WorkflowEdge, WorkflowNode, WorkflowNodeKind } from '@beak/state/workflows';
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
import { Bell, GitBranch, Globe, Play, Repeat } from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
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
		const position = { x: 280 + Math.random() * 240, y: 120 + Math.random() * 200 };
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
				h='38px'
				flexShrink={0}
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
			>
				<Input
					size='sm'
					variant='subtle'
					value={workflow.name}
					maxW='280px'
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						dispatch(workflowActions.updateWorkflowName({ id: workflowId, name: e.target.value }));
					}}
				/>
				<Box flex='1' />
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
				{selectedNode && (
					<NodePropertiesPanel
						workflowId={workflowId}
						node={selectedNode}
						onClose={() => setSelectedNodeId(null)}
					/>
				)}
			</Flex>
		</Flex>
	);
};

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

function countOverrideEntries(record?: Record<string, { enabled: boolean }>): number {
	if (!record) return 0;
	return Object.values(record).filter(r => r.enabled).length;
}

function overrideBadgeText(overrides?: RequestOverrides): string | null {
	if (!overrides) return null;
	const counts: string[] = [];
	const headers = countOverrideEntries(overrides.headers);
	const query = countOverrideEntries(overrides.query);
	if (headers > 0) counts.push(`${headers}h`);
	if (query > 0) counts.push(`${query}q`);
	if (overrides.body) counts.push('body');
	if (overrides.fragment && overrides.fragment.length > 0) counts.push('frag');
	return counts.length === 0 ? null : counts.join(' · ');
}

// Best-effort URL preview for the canvas pill. Joins string parts of the
// linked request's value-sections URL and replaces RTV parts with `{var}` so
// the pill never explodes on a templated URL.
function previewValueSections(parts: unknown[] | undefined): string {
	if (!parts) return '';
	return parts
		.map(p => {
			if (typeof p === 'string') return p;
			return '{var}';
		})
		.join('');
}

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
