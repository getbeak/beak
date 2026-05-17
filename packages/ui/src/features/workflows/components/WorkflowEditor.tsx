import ksuid from '@beak/ksuid';
import { workflowSchema } from '@beak/state/schemas/beak-workflow';
import {
	autoLayout,
	inspectGraph,
	type NodeIssue,
	nodeIssuesFromHealth,
	parseImportedWorkflow,
	placeNewNode,
	serializeForExport,
	toMarkdown,
	validateConnection,
	type WorkflowEdge,
	type WorkflowNode,
} from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
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
	useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
	Bell,
	Clipboard,
	ClipboardPaste,
	FileText,
	GitBranch,
	Globe,
	LayoutTemplate,
	Play,
	Repeat,
	StickyNote,
	Workflow as WorkflowIcon,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
	type AddableNodeKind,
	EmptySelectionPanel,
	MetaPill,
	MultiSelectPanel,
	PaneContextMenu,
	SaveStateIndicator,
	ToolbarButton,
	WarningPill,
} from './editor-chrome';
import { nodeTypes } from './node-views';
import NodePropertiesPanel from './NodePropertiesPanel';
import NodeSearchDialog from './NodeSearchDialog';
import QuickFixDialog from './QuickFixDialog';
import SimulationDialog from './SimulationDialog';

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
	const projectTree = useAppSelector(s => s.global.project.tree);
	const dispatch = useDispatch();
	// Selection is a Set so the user can multi-pick via Cmd/Ctrl-Click. Most
	// of the editor still cares about "the one selection" (single-pane,
	// keyboard duplicate, edge-highlight) — those derive the single id below.
	const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
	const [searchOpen, setSearchOpen] = useState(false);
	const [simulateOpen, setSimulateOpen] = useState(false);
	const [quickFixOpen, setQuickFixOpen] = useState(false);
	// `{ x, y }` is in flow-coordinates (already mapped); rendered absolutely
	// over the canvas at `screen-x/y` for the menu position.
	const [paneMenu, setPaneMenu] = useState<{ flow: { x: number; y: number }; screen: { x: number; y: number } } | null>(
		null,
	);
	const reactFlow = useReactFlow();
	const selectedNodeId = selectedIds.size === 1 ? [...selectedIds][0] : null;

	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
	const replaceSelection = useCallback((id: string) => setSelectedIds(new Set([id])), []);
	const toggleSelection = useCallback((id: string) => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	// xyflow's controlled API takes `Node[]` / `Edge[]`. Our schema is structurally
	// compatible — we cast through `unknown` because xyflow's generic Node has an
	// open `data` record and ours is a discriminated union.
	const rfEdges = useMemo<Edge[]>(() => (workflow ? (workflow.edges as unknown as Edge[]) : []), [workflow]);

	const health = useMemo(() => (workflow ? inspectGraph(workflow) : null), [workflow]);
	// Per-node issue (cycle > unlinked > unreachable). Threaded into rfNodes
	// below so the kind-specific node views can paint a coloured ring.
	const nodeIssues = useMemo<Map<string, NodeIssue>>(() => (health ? nodeIssuesFromHealth(health) : new Map()), [health]);

	// Reflect Redux selection + per-node issue back through xyflow's node data
	// so the node-views render with their selection ring + issue accent.
	const rfNodes = useMemo<Node[]>(() => {
		if (!workflow) return [];
		return workflow.nodes.map(n => ({
			...n,
			selected: selectedIds.has(n.id),
			data: { ...n.data, _issue: nodeIssues.get(n.id) },
		})) as unknown as Node[];
	}, [workflow, selectedIds, nodeIssues]);
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
			const isConnectedToSelection = selectedIds.has(e.source) || selectedIds.has(e.target);
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
	}, [rfEdges, selectedIds, workflow, health?.cycleNodes]);

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
				if (selectedIds.size > 0) {
					event.preventDefault();
					clearSelection();
				}
				return;
			}

			if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.size > 0) {
				event.preventDefault();
				if (selectedIds.size === 1) {
					const onlyId = [...selectedIds][0];
					const node = workflow?.nodes.find(n => n.id === onlyId);
					if (node?.type === 'start') return;
					dispatch(workflowActions.removeNode({ id: workflowId, nodeId: onlyId }));
				} else {
					dispatch(workflowActions.removeNodes({ id: workflowId, nodeIds: [...selectedIds] }));
				}
				clearSelection();
				return;
			}

			// Cmd/Ctrl-A — select every non-Start node on the canvas. Comment
			// nodes are intentionally included so the user can sweep them out
			// alongside live steps.
			if ((event.metaKey || event.ctrlKey) && (event.key === 'a' || event.key === 'A') && workflow) {
				event.preventDefault();
				const ids = workflow.nodes.filter(n => n.type !== 'start').map(n => n.id);
				setSelectedIds(new Set(ids));
				return;
			}

			// Cmd/Ctrl-K — open the node finder. Cmd-K is the universal "go to"
			// — every major code editor uses it for the same purpose.
			if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
				event.preventDefault();
				setSearchOpen(true);
				return;
			}

			// Cmd/Ctrl-D — duplicate when exactly one node is selected. Multi-
			// select duplication would need a relayout pass to keep things
			// readable; skip it for now.
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
				replaceSelection(newId);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [clearSelection, dispatch, replaceSelection, selectedIds, selectedNode, workflow, workflowId]);

	const tidyGraph = useCallback(() => {
		if (!workflow) return;
		const laidOut = autoLayout(workflow);
		dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: laidOut.nodes, edges: laidOut.edges }));
	}, [dispatch, workflow, workflowId]);

	const copyWorkflowJson = useCallback(async () => {
		if (!workflow) return;
		try {
			await navigator.clipboard.writeText(serializeForExport(workflow));
		} catch (err) {
			console.warn('[workflows] copy to clipboard failed', err);
		}
	}, [workflow]);

	const copyWorkflowMarkdown = useCallback(async () => {
		if (!workflow) return;
		try {
			const names = new Map<string, string>();
			for (const node of Object.values(projectTree)) {
				if (node.type === 'request') names.set(node.id, node.name);
			}
			await navigator.clipboard.writeText(toMarkdown(workflow, names));
		} catch (err) {
			console.warn('[workflows] copy markdown failed', err);
		}
	}, [workflow, projectTree]);

	const pasteWorkflowJson = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText();
			const result = parseImportedWorkflow(
				text,
				prefix => ksuid.generate(prefix).toString(),
				raw => workflowSchema.parse(raw),
			);
			if (!result.ok || !result.workflow) {
				console.warn('[workflows] paste rejected', result.reason);
				return;
			}
			dispatch(workflowActions.insertNewWorkflow({ id: result.workflow.id, workflow: result.workflow }));
			dispatch(changeTab({ type: 'workflow_editor', payload: result.workflow.id, temporary: false }));
		} catch (err) {
			console.warn('[workflows] paste failed', err);
		}
	}, [dispatch]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			if (!workflow) return;
			// Mirror xyflow's `select` changes into our Set — that's how shift-
			// drag lasso gets reflected in the panel and Delete handler.
			let selectionShifted = false;
			const selectChanges = changes.filter(c => c.type === 'select') as { id: string; selected: boolean }[];
			if (selectChanges.length > 0) {
				selectionShifted = true;
				setSelectedIds(prev => {
					const next = new Set(prev);
					for (const c of selectChanges) {
						if (c.selected) next.add(c.id);
						else next.delete(c.id);
					}
					return next;
				});
			}
			// Strip select changes before persisting — they're a UI artefact
			// and shouldn't flow into the file via replaceGraph.
			const persistable = selectionShifted ? changes.filter(c => c.type !== 'select') : changes;
			if (persistable.length === 0) return;
			const next = applyNodeChanges(persistable, rfNodes) as unknown as WorkflowNode[];
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
		(connection: Connection | Edge) => {
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

	function addNode(kind: AddableNodeKind, at?: { x: number; y: number }) {
		const id = ksuid.generate('node').toString();
		const position = at ?? placeNewNode(workflow.nodes);
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
			case 'comment':
				node = { id, type: 'comment', position, data: { text: '' } };
				break;
		}
		dispatch(workflowActions.addNode({ id: workflowId, node }));
	}

	return (
		<Flex direction='column' h='100%' bg='bg.canvas' minH={0} position='relative'>
			{paneMenu && (
				<PaneContextMenu
					screen={paneMenu.screen}
					onPick={kind => {
						addNode(kind, paneMenu.flow);
						setPaneMenu(null);
					}}
					onClose={() => setPaneMenu(null)}
				/>
			)}
			<NodeSearchDialog
				workflow={workflow}
				open={searchOpen}
				onClose={() => setSearchOpen(false)}
				onPick={nodeId => replaceSelection(nodeId)}
			/>
			<SimulationDialog
				workflow={workflow}
				open={simulateOpen}
				onClose={() => setSimulateOpen(false)}
				onJumpToNode={replaceSelection}
			/>
			<QuickFixDialog
				workflow={workflow}
				open={quickFixOpen}
				onClose={() => setQuickFixOpen(false)}
				onJumpToNode={replaceSelection}
			/>
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
											'click to jump',
										]
											.filter(Boolean)
											.join(' · ')
									: undefined
							}
							onClick={() => setQuickFixOpen(true)}
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
					<ToolbarButton
						icon={<StickyNote size={13} strokeWidth={1.8} />}
						label='Note'
						onClick={() => addNode('comment')}
					/>
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton icon={<LayoutTemplate size={13} strokeWidth={1.8} />} label='Tidy' onClick={tidyGraph} />
					<ToolbarButton
						icon={<Play size={13} strokeWidth={1.8} />}
						label='Simulate'
						onClick={() => setSimulateOpen(true)}
					/>
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton
						icon={<Clipboard size={13} strokeWidth={1.8} />}
						label='Copy'
						onClick={copyWorkflowJson}
					/>
					<ToolbarButton
						icon={<FileText size={13} strokeWidth={1.8} />}
						label='Doc'
						onClick={copyWorkflowMarkdown}
					/>
					<ToolbarButton
						icon={<ClipboardPaste size={13} strokeWidth={1.8} />}
						label='Paste'
						onClick={pasteWorkflowJson}
					/>
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
						onNodeClick={(event, node) => {
							// Cmd/Ctrl-click toggles in multi-select; bare click replaces.
							// Matches Finder / VS Code conventions — the user reaches for it
							// instinctively when they want to fan out a delete or move.
							if (event.metaKey || event.ctrlKey) toggleSelection(node.id);
							else replaceSelection(node.id);
						}}
						onPaneClick={() => {
							clearSelection();
							setPaneMenu(null);
						}}
						onPaneContextMenu={event => {
							const e = event as React.MouseEvent;
							e.preventDefault();
							const flow = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
							setPaneMenu({ flow, screen: { x: e.clientX, y: e.clientY } });
						}}
						onEdgeContextMenu={(event, edge) => {
							// Right-click an edge to delete it. Native context menu would
							// just show "Inspect"; suppressing + dispatching removeEdge is
							// the affordance every graph editor ships.
							event.preventDefault();
							dispatch(workflowActions.removeEdge({ id: workflowId, edgeId: edge.id }));
						}}
						onEdgeDoubleClick={(_event, edge) => {
							const current = typeof edge.label === 'string' ? edge.label : '';
							// `prompt` is intentionally low-rent here — a richer inline
							// editor lands when we have RTV chips on edges.
							const next = window.prompt('Edge label', current);
							if (next === null) return; // user hit Cancel
							dispatch(workflowActions.updateEdgeLabel({ id: workflowId, edgeId: edge.id, label: next || undefined }));
						}}
						nodeTypes={nodeTypes}
						fitView
						snapToGrid
						snapGrid={[20, 20]}
						multiSelectionKeyCode={['Meta', 'Control']}
						selectionKeyCode='Shift'
						proOptions={{ hideAttribution: true }}
					>
						<Background gap={20} size={1} />
						<MiniMap pannable zoomable />
						<Controls />
					</ReactFlow>
				</Box>
				{selectedIds.size > 1 ? (
					<MultiSelectPanel
						count={selectedIds.size}
						onDelete={() => {
							dispatch(workflowActions.removeNodes({ id: workflowId, nodeIds: [...selectedIds] }));
							clearSelection();
						}}
						onClear={() => clearSelection()}
					/>
				) : selectedNode ? (
					<NodePropertiesPanel workflowId={workflowId} node={selectedNode} onClose={() => clearSelection()} />
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
