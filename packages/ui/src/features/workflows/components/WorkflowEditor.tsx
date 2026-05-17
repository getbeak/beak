import ksuid from '@beak/ksuid';
import {
	autoLayout,
	inspectGraph,
	placeNewNode,
	validateConnection,
	type WorkflowEdge,
	type WorkflowNode,
} from '@beak/state/workflows';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, Flex, Input, Stack } from '@chakra-ui/react';
import {
	addEdge as addRfEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	MiniMap,
	type Node,
	type NodeChange,
	ReactFlow,
	ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Bell, GitBranch, Globe, LayoutTemplate, Repeat, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
	type AddableNodeKind,
	EmptySelectionPanel,
	MetaPill,
	SaveStateIndicator,
	ToolbarButton,
	WarningPill,
} from './editor-chrome';
import { nodeTypes } from './node-views';
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

const WorkflowEditorInner: React.FC<WorkflowEditorProps> = ({ workflowId }) => {
	const workflow = useAppSelector(s => s.global.workflows.workflows[workflowId]);
	const dispatch = useDispatch();
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	// xyflow's controlled API takes `Node[]` / `Edge[]`. Our schema is structurally
	// compatible — we cast through `unknown` because xyflow's generic Node has an
	// open `data` record and ours is a discriminated union.
	const rfNodes = useMemo<Node[]>(() => (workflow ? (workflow.nodes as unknown as Node[]) : []), [workflow]);
	const rfEdges = useMemo<Edge[]>(() => (workflow ? (workflow.edges as unknown as Edge[]) : []), [workflow]);

	const health = useMemo(() => (workflow ? inspectGraph(workflow) : null), [workflow]);
	const warningCount = health
		? health.unreachable.length + health.unlinkedRequestNodes.length + health.cycleNodes.length
		: 0;

	// Edge decorations: highlight the wires touching the selected node, and
	// stroke cycle edges with the warning accent so the user sees the loop
	// before they hit "run".
	const decoratedEdges = useMemo<Edge[]>(() => {
		if (!workflow) return rfEdges;
		const cycleSet = new Set(health?.cycleNodes ?? []);
		return rfEdges.map(e => {
			const onCycle = cycleSet.has(e.source) && cycleSet.has(e.target);
			const isConnectedToSelection =
				selectedNodeId !== null && (e.source === selectedNodeId || e.target === selectedNodeId);
			if (!onCycle && !isConnectedToSelection) return e;
			const style: React.CSSProperties = { ...(e.style as React.CSSProperties | undefined) };
			if (onCycle) {
				style.stroke = 'var(--beak-colors-accent-warning)';
				style.strokeWidth = 2;
			} else if (isConnectedToSelection) {
				style.stroke = 'var(--beak-colors-accent-pink)';
				style.strokeWidth = 2;
			}
			return { ...e, style, animated: onCycle ? false : isConnectedToSelection };
		});
	}, [rfEdges, selectedNodeId, workflow, health?.cycleNodes]);

	const selectedNode = useMemo(() => {
		if (!workflow || !selectedNodeId) return undefined;
		return workflow.nodes.find(n => n.id === selectedNodeId);
	}, [workflow, selectedNodeId]);

	// Keyboard: Delete/Backspace removes the selected node (unless it's Start),
	// Escape clears selection. Skip when focus is inside a text field so the
	// properties panel and toolbar inputs keep their native behaviour.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const target = event.target as HTMLElement | null;
			const tag = target?.tagName;
			const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target?.isContentEditable ?? false);
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
				return;
			}

			// Cmd/Ctrl-D — duplicate the selected node next to its source so the
			// user can crank out near-identical request steps.
			if ((event.metaKey || event.ctrlKey) && (event.key === 'd' || event.key === 'D') && selectedNode) {
				if (selectedNode.type === 'start' || !workflow) return;
				event.preventDefault();
				const newId = ksuid.generate('node').toString();
				const offset = { x: selectedNode.position.x + 60, y: selectedNode.position.y + 40 };
				dispatch(
					workflowActions.duplicateNode({
						id: workflowId,
						sourceNodeId: selectedNode.id,
						newNodeId: newId,
						position: offset,
					}),
				);
				setSelectedNodeId(newId);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dispatch, selectedNode, selectedNodeId, workflow, workflowId]);

	const tidyGraph = useCallback(() => {
		if (!workflow) return;
		const laidOut = autoLayout(workflow);
		dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: laidOut.nodes, edges: laidOut.edges }));
	}, [dispatch, workflow, workflowId]);

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
			// Defence-in-depth: xyflow already filters with `isValidConnection`,
			// but a stale viewport can race past it. Re-check here so we never
			// dispatch a self-loop / into-Start / duplicate edge.
			if (!connection.source || !connection.target) return;
			const ok = validateConnection(workflow, {
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
			});
			if (!ok.ok) return;
			const next = addRfEdge(connection, rfEdges) as unknown as WorkflowEdge[];
			// xyflow's `addEdge` synthesises ids on its own; we replace them with a
			// ksuid so the dedupe-by-id check in `addEdge` reducer is meaningful.
			const enriched = next.map(e =>
				e.id?.startsWith('xy-edge__') ? { ...e, id: ksuid.generate('edge').toString() } : e,
			);
			dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: workflow.nodes, edges: enriched }));
		},
		[dispatch, rfEdges, workflow, workflowId],
	);

	// xyflow's pre-drop hook. Returning false greys out the target handle so
	// the user sees the rejection before they release the mouse.
	const isValidConnection = useCallback(
		(connection: Connection | WorkflowEdge) => {
			if (!workflow) return false;
			if (!connection.source || !connection.target) return false;
			return validateConnection(workflow, {
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
			}).ok;
		},
		[workflow],
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
					<SaveStateIndicator />
					{warningCount > 0 && (
						<WarningPill
							count={warningCount}
							label={warningCount === 1 ? 'issue' : 'issues'}
							title={
								health
									? [
											health.unreachable.length > 0 ? `${health.unreachable.length} unreachable` : null,
											health.unlinkedRequestNodes.length > 0 ? `${health.unlinkedRequestNodes.length} unlinked` : null,
											health.cycleNodes.length > 0 ? `${health.cycleNodes.length} on cycle` : null,
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
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton icon={<LayoutTemplate size={13} strokeWidth={1.8} />} label='Tidy' onClick={tidyGraph} />
				</Stack>
			</Flex>
			<Flex flex='1' minH={0}>
				<Box flex='1' minW={0}>
					<ReactFlow
						nodes={rfNodes}
						edges={decoratedEdges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						isValidConnection={isValidConnection}
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
					<NodePropertiesPanel workflowId={workflowId} node={selectedNode} onClose={() => setSelectedNodeId(null)} />
				) : (
					<EmptySelectionPanel
						addNode={addNode}
						unreachableCount={health?.unreachable.length ?? 0}
						unlinkedCount={health?.unlinkedRequestNodes.length ?? 0}
						cycleCount={health?.cycleNodes.length ?? 0}
					/>
				)}
			</Flex>
		</Flex>
	);
};

export default WorkflowEditor;
