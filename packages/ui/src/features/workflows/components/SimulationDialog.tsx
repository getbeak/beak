import { type SimulationEvent, walkWorkflow, type WorkflowFile } from '@beak/state/workflows';
import { Box, Dialog, Flex, Stack } from '@chakra-ui/react';
import * as React from 'react';
import { useMemo } from 'react';

interface SimulationDialogProps {
	workflow: WorkflowFile;
	open: boolean;
	onClose: () => void;
	onJumpToNode: (nodeId: string) => void;
}

/**
 * "Simulate this workflow" preview. Calls `walkWorkflow` with a default
 * resolver (conditions = truthy, loops = data.count, requests = no-op)
 * and renders the event log. Clicking a node-referencing event jumps
 * back to that node in the canvas.
 *
 * Useful before the orchestrator lands — lets the user eyeball whether
 * their loop/condition wiring produces the walk they expect.
 */
const SimulationDialog: React.FC<SimulationDialogProps> = ({ workflow, open, onClose, onJumpToNode }) => {
	const events = useMemo<SimulationEvent[]>(() => {
		if (!open) return [];
		return walkWorkflow(workflow, { evaluateCondition: () => true });
	}, [workflow, open]);

	const nodeLabels = useMemo(() => {
		const map = new Map<string, string>();
		for (const node of workflow.nodes) map.set(node.id, kindShortLabel(node));
		return map;
	}, [workflow]);

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
							{'Walks the graph as if every condition were truthy and every loop ran its declared count. Requests are skipped (no real HTTP fires). Click a step to jump to it.'}
						</Box>
						<Box
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
										event={event}
										nodeLabels={nodeLabels}
										onJumpToNode={onJumpToNode}
										onClose={onClose}
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
	onJumpToNode: (nodeId: string) => void;
	onClose: () => void;
}

const EventRow: React.FC<EventRowProps> = ({ event, nodeLabels, onJumpToNode, onClose }) => {
	const { label, nodeId, tone, indent } = describe(event, nodeLabels);
	const clickable = nodeId !== undefined;
	return (
		<Flex
			as={clickable ? 'button' : 'div'}
			align='center'
			gap='2'
			px='3'
			py='1'
			pl={`${12 + indent * 14}px`}
			bg='transparent'
			cursor={clickable ? 'pointer' : 'default'}
			textAlign='left'
			_hover={clickable ? { bg: 'bg.subtle' } : undefined}
			onClick={
				clickable
					? () => {
						onJumpToNode(nodeId);
						onClose();
					}
					: undefined
			}
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

export default SimulationDialog;
