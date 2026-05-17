import ksuid from '@beak/ksuid';
import { workflowSchema } from '@beak/state/schemas/beak-workflow';
import {
	autoLayout,
	compactPositions,
	connectedComponents,
	inspectGraph,
	mergeWorkflows,
	type NodeIssue,
	nodeIssuesFromHealth,
	parseImportedWorkflow,
	placeNewNode,
	serializeForExport,
	toMarkdown,
	validateConnection,
	validateWorkflow,
	type WorkflowEdge,
	type WorkflowNode,
} from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { ipcDialogService } from '@beak/ui/lib/ipc';
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
	BarChart3,
	Bell,
	Clipboard,
	ClipboardPaste,
	Combine,
	Copy,
	FileText,
	GitBranch,
	Globe,
	HelpCircle,
	LayoutTemplate,
	Maximize2,
	Minimize2,
	Play,
	Repeat,
	StickyNote,
	Tag,
	Trash2,
	Workflow as WorkflowIcon,
	Wrench,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
	type AddableNodeKind,
	EdgeInspectorPanel,
	EdgeLabelEditor,
	EmptyCanvasCallout,
	EmptySelectionPanel,
	MetaPill,
	MultiSelectPanel,
	PaneContextMenu,
	SaveStateIndicator,
	ToolbarButton,
	WarningPill,
} from './editor-chrome';
import { nodeTypes } from './node-views';
import CheatSheetDialog from './CheatSheetDialog';
import NodePropertiesPanel from './NodePropertiesPanel';
import NodeSearchDialog from './NodeSearchDialog';
import QuickFixDialog from './QuickFixDialog';
import SimulationDialog from './SimulationDialog';
import StatsDialog from './StatsDialog';

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
	const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [simulateOpen, setSimulateOpen] = useState(false);
	const [quickFixOpen, setQuickFixOpen] = useState(false);
	const [statsOpen, setStatsOpen] = useState(false);
	const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
	const [activeSimEdgeId, setActiveSimEdgeId] = useState<string | null>(null);
	// `{ x, y }` is in flow-coordinates (already mapped); rendered absolutely
	// over the canvas at `screen-x/y` for the menu position.
	const [paneMenu, setPaneMenu] = useState<{ flow: { x: number; y: number }; screen: { x: number; y: number } } | null>(
		null,
	);
	const [edgeLabelEditor, setEdgeLabelEditor] = useState<{
		edgeId: string;
		initialLabel: string;
		screen: { x: number; y: number };
	} | null>(null);
	const [nodeRenameEditor, setNodeRenameEditor] = useState<{
		nodeId: string;
		initialName: string;
		screen: { x: number; y: number };
	} | null>(null);
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
	const componentCount = useMemo(() => (workflow ? connectedComponents(workflow).length : 0), [workflow]);
	// Per-node issue (cycle > unlinked > unreachable). Threaded into rfNodes
	// below so the kind-specific node views can paint a coloured ring.
	const nodeIssues = useMemo<Map<string, NodeIssue>>(() => (health ? nodeIssuesFromHealth(health) : new Map()), [health]);
	const nodeWarnings = useMemo(() => (workflow ? validateWorkflow(workflow) : new Map<string, unknown>()), [workflow]);
	const nodeWarningsCount = nodeWarnings.size;

	// Reflect Redux selection + per-node issue/warning back through xyflow's
	// node data so the node-views render with their selection ring + issue
	// accent + warning dot.
	const rfNodes = useMemo<Node[]>(() => {
		if (!workflow) return [];
		return workflow.nodes.map(n => ({
			...n,
			selected: selectedIds.has(n.id),
			data: {
				...n.data,
				_issue: nodeIssues.get(n.id),
				_name: (n as { name?: string }).name,
				_warned: nodeWarnings.has(n.id),
			},
		})) as unknown as Node[];
	}, [workflow, selectedIds, nodeIssues, nodeWarnings]);
	const warningCount = health
		? health.unreachable.length + health.unlinkedRequestNodes.length + health.cycleNodes.length + nodeWarningsCount
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
			const handleColor = edgeColorForHandle(typeof e.sourceHandle === 'string' ? e.sourceHandle : null);
			const isActiveSim = activeSimEdgeId === e.id;
			if (!onCycle && !isConnectedToSelection && !handleColor && !isActiveSim) return e;
			const style: React.CSSProperties = { ...(e.style as React.CSSProperties | undefined) };
			if (isActiveSim) {
				style.stroke = 'var(--beak-colors-accent-pink)';
				style.strokeWidth = 3;
			} else if (onCycle) {
				style.stroke = 'var(--beak-colors-accent-warning)';
				style.strokeWidth = 2;
			} else if (isConnectedToSelection) {
				style.stroke = 'var(--beak-colors-accent-pink)';
				style.strokeWidth = 2;
			} else if (handleColor) {
				style.stroke = handleColor;
				style.strokeWidth = 1.5;
			}
			return { ...e, style, animated: isActiveSim ? true : onCycle ? false : isConnectedToSelection };
		});
	}, [rfEdges, selectedIds, workflow, health?.cycleNodes, activeSimEdgeId]);

	const selectedNode = useMemo(() => {
		if (!workflow || !selectedNodeId) return undefined;
		return workflow.nodes.find(n => n.id === selectedNodeId);
	}, [workflow, selectedNodeId]);

	const selectedEdge = useMemo(() => {
		if (!workflow || !selectedEdgeId) return undefined;
		return workflow.edges.find(e => e.id === selectedEdgeId);
	}, [workflow, selectedEdgeId]);

	const fitView = useCallback(
		(scope: 'all' | 'selection' = 'all') => {
			// xyflow's instance fits the viewport to the named nodes (or the
			// whole graph when `nodes` is omitted). Padding matches the
			// canvas's fitView prop so the manual click feels identical to
			// the first-paint behaviour. 300ms animation reads as intentional.
			const opts: { padding: number; duration: number; nodes?: { id: string }[] } = {
				padding: 0.1,
				duration: 300,
			};
			if (scope === 'selection' && selectedIds.size > 0) {
				opts.nodes = [...selectedIds].map(id => ({ id }));
			}
			reactFlow.fitView(opts);
		},
		[reactFlow, selectedIds],
	);

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

			// Edge-selected → Delete / Backspace removes it. Mirrors the
			// node-selected handling above.
			if ((event.key === 'Delete' || event.key === 'Backspace') && selectedEdgeId) {
				event.preventDefault();
				dispatch(workflowActions.removeEdge({ id: workflowId, edgeId: selectedEdgeId }));
				setSelectedEdgeId(null);
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

			// ? (or Cmd-/) — open the cheat sheet. ? alone requires shift on
			// most layouts; Cmd-/ is the universal "help" shortcut every
			// editor on a Mac uses.
			if (
				(!event.metaKey && !event.ctrlKey && !event.altKey && event.key === '?') ||
				((event.metaKey || event.ctrlKey) && event.key === '/')
			) {
				event.preventDefault();
				setCheatSheetOpen(true);
				return;
			}

			// Cmd-. / Ctrl-. — fit viewport to current selection (or whole
			// graph if nothing's selected).
			if ((event.metaKey || event.ctrlKey) && event.key === '.') {
				event.preventDefault();
				fitView(selectedIds.size > 0 ? 'selection' : 'all');
				return;
			}

			// Cmd/Ctrl-Shift-D — fork the *whole* workflow into a sibling copy
			// ("Copy of …"). Lives next to Cmd-D so the user can pick "duplicate
			// node" vs. "duplicate workflow" by holding Shift.
			if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'd' || event.key === 'D') && workflow) {
				event.preventDefault();
				dispatch(workflowActions.duplicateWorkflow({ sourceId: workflowId }));
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
				return;
			}

			// Arrow keys nudge the selected node(s) by gridSize (or 5× with
			// Shift). The toolbar uses the same 20px grid; matching here keeps
			// keyboard moves snapped without extra work.
			if (workflow && !event.metaKey && !event.ctrlKey && !event.altKey && selectedIds.size > 0) {
				const delta = nudgeDeltaForKey(event.key, event.shiftKey ? 100 : 20);
				if (delta) {
					event.preventDefault();
					for (const id of selectedIds) {
						const node = workflow.nodes.find(n => n.id === id);
						if (!node) continue;
						dispatch(
							workflowActions.moveNode({
								id: workflowId,
								nodeId: id,
								position: { x: node.position.x + delta.x, y: node.position.y + delta.y },
							}),
						);
					}
					return;
				}
			}

			// Bare-letter hotkeys for adding nodes — R / L / C / N / M. Skip
			// when modifiers are held so Cmd-R (page reload) etc. aren't
			// hijacked. The `isEditable` guard above already protects inputs.
			if (workflow && !event.metaKey && !event.ctrlKey && !event.altKey) {
				const kind = kindForKey(event.key);
				if (kind) {
					event.preventDefault();
					addNode(kind);
					return;
				}
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [clearSelection, dispatch, fitView, replaceSelection, selectedIds, selectedNode, workflow, workflowId]);

	const tidyGraph = useCallback(() => {
		if (!workflow) return;
		const laidOut = autoLayout(workflow);
		dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: laidOut.nodes, edges: laidOut.edges }));
	}, [dispatch, workflow, workflowId]);

	const compactGraph = useCallback(() => {
		if (!workflow) return;
		const compacted = compactPositions(workflow);
		if (compacted === workflow) return; // no-op shortcut: nothing changed
		dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: compacted.nodes, edges: compacted.edges }));
	}, [dispatch, workflow, workflowId]);

	const clearGraph = useCallback(async () => {
		if (!workflow) return;
		if (workflow.nodes.length <= 1 && workflow.edges.length === 0) return;
		const result = await ipcDialogService.showMessageBox({
			type: 'warning',
			title: 'Clear workflow',
			message: 'Remove every step except Start?',
			detail: 'This drops every node and edge on the canvas; the workflow file itself stays.',
			buttons: ['Clear', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});
		if (result.response === 1) return;
		dispatch(workflowActions.clearGraph({ id: workflowId }));
		clearSelection();
	}, [dispatch, workflow, workflowId, clearSelection]);

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

	const mergeWorkflowJson = useCallback(async () => {
		if (!workflow) return;
		try {
			const text = await navigator.clipboard.readText();
			let parsed: ReturnType<typeof workflowSchema.parse>;
			try {
				parsed = workflowSchema.parse(JSON.parse(text));
			} catch (err) {
				console.warn('[workflows] merge: invalid JSON / schema', err);
				return;
			}
			const merged = mergeWorkflows(workflow, parsed, prefix => ksuid.generate(prefix).toString());
			dispatch(workflowActions.replaceGraph({ id: workflowId, nodes: merged.nodes, edges: merged.edges }));
		} catch (err) {
			console.warn('[workflows] merge failed', err);
		}
	}, [dispatch, workflow, workflowId]);

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

	function addNode(kind: AddableNodeKind, at?: { x: number; y: number }, opts?: { wireFromSelection?: boolean }) {
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
		// If a node was selected when the user added a new one (typically via
		// the pane right-click menu after picking a step), wire from the
		// selection into the new node. Skip for comments — they don't take
		// inbound edges. Skip for non-Request → Start guard.
		if (opts?.wireFromSelection && kind !== 'comment' && selectedNodeId) {
			const source = workflow.nodes.find(n => n.id === selectedNodeId);
			if (source && source.type !== 'comment') {
				dispatch(
					workflowActions.addEdge({
						id: workflowId,
						edge: { id: ksuid.generate('edge').toString(), source: selectedNodeId, target: id },
					}),
				);
			}
		}
		// Select the new node so subsequent edits land on it.
		replaceSelection(id);
	}

	return (
		<Flex direction='column' h='100%' bg='bg.canvas' minH={0} position='relative'>
			{paneMenu && (
				<PaneContextMenu
					screen={paneMenu.screen}
					onPick={kind => {
						addNode(kind, paneMenu.flow, { wireFromSelection: true });
						setPaneMenu(null);
					}}
					onClose={() => setPaneMenu(null)}
				/>
			)}
			{edgeLabelEditor && (
				<EdgeLabelEditor
					screen={edgeLabelEditor.screen}
					initialLabel={edgeLabelEditor.initialLabel}
					onCommit={next => {
						dispatch(
							workflowActions.updateEdgeLabel({
								id: workflowId,
								edgeId: edgeLabelEditor.edgeId,
								label: next || undefined,
							}),
						);
						setEdgeLabelEditor(null);
					}}
					onCancel={() => setEdgeLabelEditor(null)}
				/>
			)}
			{nodeRenameEditor && (
				<EdgeLabelEditor
					screen={nodeRenameEditor.screen}
					initialLabel={nodeRenameEditor.initialName}
					onCommit={next => {
						dispatch(
							workflowActions.renameNode({
								id: workflowId,
								nodeId: nodeRenameEditor.nodeId,
								name: next || undefined,
							}),
						);
						setNodeRenameEditor(null);
					}}
					onCancel={() => setNodeRenameEditor(null)}
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
				onClose={() => {
					setSimulateOpen(false);
					setActiveSimEdgeId(null);
				}}
				onJumpToNode={replaceSelection}
				onActiveEdge={setActiveSimEdgeId}
			/>
			<QuickFixDialog
				workflow={workflow}
				open={quickFixOpen}
				onClose={() => setQuickFixOpen(false)}
				onJumpToNode={replaceSelection}
			/>
			<StatsDialog workflow={workflow} open={statsOpen} onClose={() => setStatsOpen(false)} />
			<CheatSheetDialog open={cheatSheetOpen} onClose={() => setCheatSheetOpen(false)} />
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
					{componentCount > 1 && (
						<MetaPill
							icon={<LayoutTemplate size={10} strokeWidth={2.2} />}
							count={componentCount}
							label={componentCount === 1 ? 'island' : 'islands'}
						/>
					)}
					{workflow.tags && workflow.tags.length > 0 && (
						<MetaPill
							icon={<Tag size={10} strokeWidth={2.2} />}
							count={workflow.tags.length}
							label={workflow.tags.length === 1 ? 'tag' : 'tags'}
						/>
					)}
					<SaveStateIndicator workflowId={workflowId} />
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
					<ToolbarButton
						icon={<Globe size={13} strokeWidth={1.8} />}
						label='Request'
						shortcut='R'
						hint='Add a Request step'
						onClick={() => addNode('request')}
					/>
					<ToolbarButton
						icon={<Repeat size={13} strokeWidth={1.8} />}
						label='Loop'
						shortcut='L'
						hint='Add a Loop step'
						onClick={() => addNode('loop')}
					/>
					<ToolbarButton
						icon={<GitBranch size={13} strokeWidth={1.8} />}
						label='Condition'
						shortcut='C'
						hint='Add a Condition step'
						onClick={() => addNode('condition')}
					/>
					<ToolbarButton
						icon={<Bell size={13} strokeWidth={1.8} />}
						label='Notification'
						shortcut='N'
						hint='Add a Notification step'
						onClick={() => addNode('notification')}
					/>
					<ToolbarButton
						icon={<StickyNote size={13} strokeWidth={1.8} />}
						label='Note'
						shortcut='M'
						hint='Add a sticky note'
						onClick={() => addNode('comment')}
					/>
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton
						icon={<LayoutTemplate size={13} strokeWidth={1.8} />}
						label='Tidy'
						hint='BFS auto-layout — readable left-to-right'
						onClick={tidyGraph}
					/>
					<ToolbarButton
						icon={<Minimize2 size={13} strokeWidth={1.8} />}
						label='Compact'
						hint='Shift the graph back to the canvas origin'
						onClick={compactGraph}
					/>
					<ToolbarButton
						icon={<Maximize2 size={13} strokeWidth={1.8} />}
						label='Fit'
						shortcut='⌘ .'
						hint='Fit the viewport to the graph'
						onClick={() => fitView('all')}
					/>
					<ToolbarButton
						icon={<Trash2 size={13} strokeWidth={1.8} />}
						label='Clear'
						hint='Drop every node and edge (Start stays)'
						onClick={clearGraph}
					/>
					<ToolbarButton
						icon={<Play size={13} strokeWidth={1.8} />}
						label='Simulate'
						hint='Walk the graph with default resolvers'
						onClick={() => setSimulateOpen(true)}
					/>
					<ToolbarButton
						icon={<BarChart3 size={13} strokeWidth={1.8} />}
						label='Stats'
						hint='Per-kind / per-handle / bounds breakdown'
						onClick={() => setStatsOpen(true)}
					/>
					<ToolbarButton
						icon={<Wrench size={13} strokeWidth={1.8} />}
						label='Lint'
						hint='List per-node warnings and quick fixes'
						onClick={() => setQuickFixOpen(true)}
					/>
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton
						icon={<Clipboard size={13} strokeWidth={1.8} />}
						label='Copy'
						hint='Copy the whole workflow as JSON to the clipboard'
						onClick={copyWorkflowJson}
					/>
					<ToolbarButton
						icon={<FileText size={13} strokeWidth={1.8} />}
						label='Doc'
						hint='Copy a Markdown summary of the workflow'
						onClick={copyWorkflowMarkdown}
					/>
					<ToolbarButton
						icon={<ClipboardPaste size={13} strokeWidth={1.8} />}
						label='Paste'
						hint='Replace the canvas with JSON from the clipboard (ids re-keyed)'
						onClick={pasteWorkflowJson}
					/>
					<ToolbarButton
						icon={<Combine size={13} strokeWidth={1.8} />}
						label='Merge'
						hint='Graft clipboard JSON into this workflow without overwriting'
						onClick={mergeWorkflowJson}
					/>
					<ToolbarButton
						icon={<Copy size={13} strokeWidth={1.8} />}
						label='Fork'
						shortcut='⌘ ⇧ D'
						hint='Duplicate this workflow into a sibling "Copy of …"'
						onClick={() => dispatch(workflowActions.duplicateWorkflow({ sourceId: workflowId }))}
					/>
					<Box w='1px' h='14px' bg='border.subtle' alignSelf='center' mx='1' />
					<ToolbarButton
						icon={<HelpCircle size={13} strokeWidth={1.8} />}
						label='Help'
						shortcut='?'
						hint='Keyboard shortcut cheat sheet'
						onClick={() => setCheatSheetOpen(true)}
					/>
				</Stack>
			</Flex>
			<Flex flex='1' minH={0}>
				<Box flex='1' minW={0} position='relative'>
					{workflow.nodes.length <= 1 && workflow.edges.length === 0 && (
						<EmptyCanvasCallout onAddRequest={() => addNode('request')} />
					)}
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
							setSelectedEdgeId(null);
						}}
						onEdgeClick={(_event, edge) => {
							setSelectedEdgeId(edge.id);
							clearSelection();
						}}
						onPaneClick={() => {
							clearSelection();
							setSelectedEdgeId(null);
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
						onEdgeDoubleClick={(event, edge) => {
							const current = typeof edge.label === 'string' ? edge.label : '';
							setEdgeLabelEditor({
								edgeId: edge.id,
								initialLabel: current,
								screen: { x: event.clientX, y: event.clientY },
							});
						}}
						onNodeDoubleClick={(event, node) => {
							const current = (node.data as { _name?: string } | undefined)?._name ?? '';
							setNodeRenameEditor({
								nodeId: node.id,
								initialName: current,
								screen: { x: event.clientX, y: event.clientY },
							});
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
						<MiniMap pannable zoomable nodeColor={miniMapNodeColor} />
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
				) : selectedEdge ? (
					<EdgeInspectorPanel
						edge={selectedEdge}
						sourceLabel={nodeLabelById(workflow, selectedEdge.source)}
						targetLabel={nodeLabelById(workflow, selectedEdge.target)}
						onRename={label =>
							dispatch(workflowActions.updateEdgeLabel({ id: workflowId, edgeId: selectedEdge.id, label }))
						}
						onDelete={() => {
							dispatch(workflowActions.removeEdge({ id: workflowId, edgeId: selectedEdge.id }));
							setSelectedEdgeId(null);
						}}
						onClose={() => setSelectedEdgeId(null)}
						onJumpToNode={id => {
							replaceSelection(id);
							setSelectedEdgeId(null);
						}}
					/>
				) : (
					<EmptySelectionPanel
						addNode={addNode}
						unreachableCount={health?.unreachable.length ?? 0}
						unlinkedCount={health?.unlinkedRequestNodes.length ?? 0}
						cycleCount={health?.cycleNodes.length ?? 0}
						description={workflow.description ?? ''}
						onChangeDescription={next =>
							dispatch(workflowActions.updateWorkflowDescription({ id: workflowId, description: next }))
						}
						tags={workflow.tags ?? []}
						onChangeTags={next => dispatch(workflowActions.setWorkflowTags({ id: workflowId, tags: next }))}
					/>
				)}
			</Flex>
		</Flex>
	);
};

/**
 * Edge stroke colour by sourceHandle. `true`/`false` branches inherit
 * the success/alert accents (matching the labels on the condition node
 * pill); `body`/`after` use the loop tones; unhandled edges fall back
 * to the canvas default. Returns `null` for "no override" so the
 * caller can decide whether to apply.
 */
function edgeColorForHandle(handle: string | null): string | null {
	switch (handle) {
		case 'true':
			return 'var(--beak-colors-accent-success)';
		case 'false':
			return 'var(--beak-colors-accent-alert)';
		case 'body':
			return 'var(--beak-colors-accent-teal)';
		case 'after':
			return 'var(--beak-colors-accent-pink)';
		default:
			return null;
	}
}

/**
 * Mini-map node tint by kind — same tones the canvas pills use, so the
 * mini-map reads as a faithful scaled-down view of the graph. xyflow
 * calls this per node; we cast through `Node` because xyflow doesn't
 * know our discriminated union.
 */
function miniMapNodeColor(node: Node): string {
	const type = (node as { type?: string }).type;
	switch (type) {
		case 'start':
			return 'var(--beak-colors-accent-success)';
		case 'request':
			return 'var(--beak-colors-accent-pink)';
		case 'loop':
			return 'var(--beak-colors-accent-teal)';
		case 'condition':
			return 'var(--beak-colors-accent-indigo)';
		case 'notification':
			return 'var(--beak-colors-accent-warning)';
		case 'comment':
			return 'var(--beak-colors-accent-warning)';
		default:
			return 'var(--beak-colors-fg-subtle)';
	}
}

/**
 * Maps the four arrow keys onto a position delta. Returns `null` for
 * non-arrow keys so the keyboard handler can pass them through.
 */
function nudgeDeltaForKey(key: string, step: number): { x: number; y: number } | null {
	switch (key) {
		case 'ArrowUp':
			return { x: 0, y: -step };
		case 'ArrowDown':
			return { x: 0, y: step };
		case 'ArrowLeft':
			return { x: -step, y: 0 };
		case 'ArrowRight':
			return { x: step, y: 0 };
		default:
			return null;
	}
}

/**
 * Maps the canvas hotkeys (R / L / C / N / M) onto add-node kinds.
 * Returns `null` for unrecognised keys so the keyboard handler can
 * pass them through to xyflow / browser defaults.
 */
function kindForKey(key: string): AddableNodeKind | null {
	switch (key.toLowerCase()) {
		case 'r':
			return 'request';
		case 'l':
			return 'loop';
		case 'c':
			return 'condition';
		case 'n':
			return 'notification';
		case 'm':
			return 'comment';
		default:
			return null;
	}
}

function nodeLabelById(workflow: WorkflowFileLike, id: string): string {
	const node = workflow.nodes.find(n => n.id === id);
	if (!node) return `(missing ${id.slice(0, 6)})`;
	const explicit = (node as { name?: string }).name?.trim();
	if (explicit) return explicit;
	switch (node.type) {
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
			return 'Note';
	}
}

type WorkflowFileLike = { nodes: ReadonlyArray<WorkflowNode> };

export default WorkflowEditor;
