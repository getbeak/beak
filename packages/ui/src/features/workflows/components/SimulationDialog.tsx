import { type SimulationEvent, walkWorkflow, type WorkflowFile } from '@beak/state/workflows';
import { Box, Button, Dialog, Flex, Stack } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Play, SkipForward } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface SimulationDialogProps {
	workflow: WorkflowFile;
	open: boolean;
	onClose: () => void;
	onJumpToNode: (nodeId: string) => void;
	/**
	 * Fired each time the cursor lands on an edge-followed event, so the
	 * editor can stroke the active wire on the canvas. Fires `null` when
	 * the cursor moves off an edge event or the dialog closes.
	 */
	onActiveEdge?: (edgeId: string | null) => void;
}

/**
 * "Simulate this workflow" preview. Calls `walkWorkflow` with a default
 * resolver (conditions = truthy, loops = data.count) and renders the
 * event log with prev/next/play step-through controls — clicking an
 * event jumps to its node.
 *
 * Useful before the orchestrator lands — lets the user eyeball whether
 * their loop/condition wiring produces the walk they expect.
 */
const SimulationDialog: React.FC<SimulationDialogProps> = ({ workflow, open, onClose, onJumpToNode, onActiveEdge }) => {
	const events = useMemo<SimulationEvent[]>(() => {
		if (!open) return [];
		return walkWorkflow(workflow, { evaluateCondition: () => true });
	}, [workflow, open]);

	const nodeLabels = useMemo(() => {
		const map = new Map<string, string>();
		for (const node of workflow.nodes) map.set(node.id, kindShortLabel(node));
		return map;
	}, [workflow]);

	// Cursor pointing at the most recent "current" event. Step-through plays
	// from 0 up to events.length - 1. Reset when the event stream changes
	// (re-opening, workflow edit).
	const [cursor, setCursor] = useState(0);
	const [playing, setPlaying] = useState(false);
	const listRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setCursor(0);
		setPlaying(false);
	}, [events]);

	// Auto-play steps through one event every 350ms. Stops at the end.
	useEffect(() => {
		if (!playing) return;
		if (cursor >= events.length - 1) {
			setPlaying(false);
			return;
		}
		const id = window.setTimeout(() => setCursor(c => Math.min(events.length - 1, c + 1)), 350);
		return () => window.clearTimeout(id);
	}, [playing, cursor, events.length]);

	// Auto-scroll the active row into view so the cursor stays visible.
	useEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const row = list.querySelector<HTMLElement>(`[data-event-idx="${cursor}"]`);
		row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, [cursor]);

	// Highlight the current node on the canvas as the cursor advances. We
	// don't close the dialog — the user is following along.
	useEffect(() => {
		if (!open) return;
		const event = events[cursor];
		if (!event) return;
		const id = currentNodeId(event);
		if (id) onJumpToNode(id);
		// Fire the active-edge callback when the cursor lands on an
		// edge-followed event; null otherwise so the highlight clears
		// between hops.
		onActiveEdge?.(event.type === 'edge-followed' ? event.edgeId : null);
	}, [cursor, events, open, onJumpToNode, onActiveEdge]);

	useEffect(() => {
		if (!open && onActiveEdge) onActiveEdge(null);
	}, [open, onActiveEdge]);

	const atEnd = cursor >= events.length - 1;
	const atStart = cursor <= 0;

	return (
		<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='lg' placement='center'>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{'Simulate workflow'}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<Box mb='2' fontSize='12px' color='fg.muted'>
							{'Walks the graph as if every condition were truthy and every loop ran its declared count. Requests are skipped (no real HTTP fires).'}
						</Box>
						<Flex align='center' gap='1' mb='2'>
							<Button
								type='button'
								size='xs'
								variant='outline'
								disabled={atStart}
								onClick={() => setCursor(c => Math.max(0, c - 1))}
							>
								<ChevronLeft size={12} strokeWidth={1.8} />
								{'Prev'}
							</Button>
							<Button
								type='button'
								size='xs'
								variant='outline'
								disabled={atEnd}
								onClick={() => setCursor(c => Math.min(events.length - 1, c + 1))}
							>
								{'Next'}
								<ChevronRight size={12} strokeWidth={1.8} />
							</Button>
							<Button
								type='button'
								size='xs'
								variant='solid'
								colorPalette='pink'
								disabled={atEnd}
								onClick={() => setPlaying(p => !p)}
							>
								{playing ? (
									<>
										<SkipForward size={12} strokeWidth={1.8} />
										{'Pause'}
									</>
								) : (
									<>
										<Play size={12} strokeWidth={1.8} fill='currentColor' />
										{'Play'}
									</>
								)}
							</Button>
							<Box flex='1' />
							<Box fontSize='10px' color='fg.subtle' fontVariantNumeric='tabular-nums'>
								{`step ${Math.min(cursor + 1, events.length)} / ${events.length}`}
							</Box>
						</Flex>
						<Box
							ref={listRef}
							maxH='420px'
							overflowY='auto'
							borderWidth='1px'
							borderColor='border.subtle'
							borderRadius='md'
							bg='bg.canvas'
						>
							<Stack gap='0' fontFamily='mono' fontSize='11px'>
								{events.map((event, i) => (
									<EventRow
										key={i}
										idx={i}
										current={i === cursor}
										event={event}
										nodeLabels={nodeLabels}
										onPick={() => setCursor(i)}
									/>
								))}
							</Stack>
						</Box>
					</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
};

interface EventRowProps {
	event: SimulationEvent;
	nodeLabels: Map<string, string>;
	onPick: () => void;
	idx: number;
	current: boolean;
}

const EventRow: React.FC<EventRowProps> = ({ event, nodeLabels, onPick, idx, current }) => {
	const { label, nodeId, tone, indent } = describe(event, nodeLabels);
	const clickable = nodeId !== undefined;
	return (
		<Flex
			as={clickable ? 'button' : 'div'}
			data-event-idx={idx}
			align='center'
			gap='2'
			px='3'
			py='1'
			pl={`${12 + indent * 14}px`}
			bg={current ? 'bg.subtle' : 'transparent'}
			borderLeftWidth='2px'
			borderLeftColor={current ? 'accent.pink' : 'transparent'}
			cursor={clickable ? 'pointer' : 'default'}
			textAlign='left'
			_hover={clickable ? { bg: 'bg.subtle' } : undefined}
			onClick={clickable ? onPick : undefined}
		>
			<Box w='8px' h='8px' borderRadius='full' bg={tone} flexShrink={0} />
			<Box color='fg.default'>{label}</Box>
		</Flex>
	);
};

function describe(
	event: SimulationEvent,
	nodeLabels: Map<string, string>,
): { label: string; nodeId?: string; tone: string; indent: number } {
	switch (event.type) {
		case 'workflow-start':
			return { label: '▶ workflow start', tone: 'var(--beak-colors-accent-success)', indent: 0 };
		case 'workflow-complete':
			return { label: '✓ workflow complete', tone: 'var(--beak-colors-accent-success)', indent: 0 };
		case 'workflow-aborted':
			return {
				label: `✗ aborted — ${event.reason}`,
				tone: 'var(--beak-colors-accent-alert)',
				indent: 0,
			};
		case 'enter-node':
			return {
				label: `→ enter ${labelFor(event.nodeId, nodeLabels)}`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-accent-pink)',
				indent: 1,
			};
		case 'exit-node':
			return {
				label: `← exit ${labelFor(event.nodeId, nodeLabels)}`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-fg-muted)',
				indent: 1,
			};
		case 'edge-followed':
			return {
				label: `↳ ${labelFor(event.from, nodeLabels)} → ${labelFor(event.to, nodeLabels)}`,
				tone: 'var(--beak-colors-fg-subtle)',
				indent: 2,
			};
		case 'condition-evaluated':
			return {
				label: `? ${labelFor(event.nodeId, nodeLabels)} = ${event.branch}`,
				nodeId: event.nodeId,
				tone:
					event.branch === 'true'
						? 'var(--beak-colors-accent-success)'
						: 'var(--beak-colors-accent-alert)',
				indent: 2,
			};
		case 'loop-iteration':
			return {
				label: `↻ ${labelFor(event.nodeId, nodeLabels)} #${event.index}`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-accent-teal)',
				indent: 2,
			};
		case 'request-skipped':
			return {
				label: `… request skipped (${event.reason})`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-accent-warning)',
				indent: 2,
			};
		case 'request-completed':
			return {
				label: `✓ request ${labelFor(event.nodeId, nodeLabels)}`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-accent-success)',
				indent: 2,
			};
		case 'notification-fired':
			return {
				label: `🔔 "${event.title}"`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-accent-warning)',
				indent: 2,
			};
		case 'comment-skipped':
			return {
				label: `… comment skipped`,
				nodeId: event.nodeId,
				tone: 'var(--beak-colors-fg-subtle)',
				indent: 2,
			};
		default: {
			const _exhaustive: never = event;
			void _exhaustive;
			return { label: 'unknown', tone: 'var(--beak-colors-fg-subtle)', indent: 0 };
		}
	}
}

function labelFor(nodeId: string, labels: Map<string, string>): string {
	return `${labels.get(nodeId) ?? '?'}:${nodeId.slice(0, 6)}`;
}

function kindShortLabel(node: WorkflowFile['nodes'][number]): string {
	switch (node.type) {
		case 'start':
			return 'start';
		case 'request':
			return 'req';
		case 'loop':
			return 'loop';
		case 'condition':
			return 'if';
		case 'notification':
			return 'notif';
		case 'comment':
			return 'note';
	}
}

function currentNodeId(event: SimulationEvent): string | null {
	switch (event.type) {
		case 'enter-node':
		case 'exit-node':
		case 'condition-evaluated':
		case 'loop-iteration':
		case 'request-skipped':
		case 'request-completed':
		case 'notification-fired':
		case 'comment-skipped':
			return event.nodeId;
		default:
			return null;
	}
}

export default SimulationDialog;
