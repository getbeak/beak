import { inspectGraph, validateWorkflow, type WorkflowFile } from '@beak/state/workflows';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, Button, Dialog, Flex, Stack } from '@chakra-ui/react';
import { Bell, GitBranch, Globe, Repeat, StickyNote, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

interface QuickFixDialogProps {
	workflow: WorkflowFile;
	open: boolean;
	onClose: () => void;
	onJumpToNode: (nodeId: string) => void;
}

/**
 * "Fix issues" surface. Reads the live workflow's health snapshot and
 * lists one actionable card per problem: jump-to to fix manually, or a
 * primary "Remove" for cases where the right answer is "drop the node".
 *
 * Bulk actions land at the top — "Remove all unreachable steps" is
 * common enough to merit its own row vs. clicking each individually.
 */
const QuickFixDialog: React.FC<QuickFixDialogProps> = ({ workflow, open, onClose, onJumpToNode }) => {
	const dispatch = useDispatch();
	const health = useMemo(() => inspectGraph(workflow), [workflow]);
	const warnings = useMemo(() => validateWorkflow(workflow), [workflow]);
	const issueCount =
		health.cycleNodes.length + health.unlinkedRequestNodes.length + health.unreachable.length + warnings.size;

	const nodesById = useMemo(() => new Map(workflow.nodes.map(n => [n.id, n])), [workflow]);

	function nodeLabel(id: string): string {
		const node = nodesById.get(id);
		if (!node) return `Unknown (${id.slice(0, 6)})`;
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

	function iconFor(id: string): React.ReactNode {
		const node = nodesById.get(id);
		switch (node?.type) {
			case 'request':
				return <Globe size={14} strokeWidth={1.8} />;
			case 'loop':
				return <Repeat size={14} strokeWidth={1.8} />;
			case 'condition':
				return <GitBranch size={14} strokeWidth={1.8} />;
			case 'notification':
				return <Bell size={14} strokeWidth={1.8} />;
			case 'comment':
				return <StickyNote size={14} strokeWidth={1.8} />;
			default:
				return <WorkflowIcon size={14} strokeWidth={1.8} />;
		}
	}

	function jump(id: string) {
		onJumpToNode(id);
		onClose();
	}

	function remove(ids: string[]) {
		dispatch(workflowActions.removeNodes({ id: workflow.id, nodeIds: ids }));
		// Close if nothing's left to fix — otherwise stay open so the user can
		// keep picking off issues.
		if (issueCount - ids.length <= 0) onClose();
	}

	return (
		<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='md' placement='center'>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{issueCount === 0 ? 'Looks good!' : `Fix ${issueCount} issue${issueCount === 1 ? '' : 's'}`}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						{issueCount === 0 ? (
							<Box fontSize='12px' color='fg.muted'>
								{'No issues found — every step is reachable, every request is linked, and there are no cycles.'}
							</Box>
						) : (
							<Stack gap='3'>
								{health.unreachable.length > 0 && (
									<Button
										type='button'
										size='sm'
										colorPalette='red'
										variant='outline'
										onClick={() => remove(health.unreachable)}
									>
										{`Remove all ${health.unreachable.length} unreachable step${health.unreachable.length === 1 ? '' : 's'}`}
									</Button>
								)}

								{health.cycleNodes.length > 0 && (
									<Section title='Cycles'>
										{health.cycleNodes.map(id => (
											<Row key={id} icon={iconFor(id)} label={nodeLabel(id)} hint='Sits on a cycle — break the loop manually'>
												<Button type='button' size='xs' variant='outline' onClick={() => jump(id)}>
													{'Jump to'}
												</Button>
											</Row>
										))}
									</Section>
								)}

								{health.unlinkedRequestNodes.length > 0 && (
									<Section title='Unlinked request steps'>
										{health.unlinkedRequestNodes.map(id => (
											<Row key={id} icon={iconFor(id)} label={nodeLabel(id)} hint='Pick a request from the project'>
												<Button type='button' size='xs' variant='outline' onClick={() => jump(id)}>
													{'Pick request →'}
												</Button>
											</Row>
										))}
									</Section>
								)}

								{health.unreachable.length > 0 && (
									<Section title='Unreachable steps'>
										{health.unreachable.map(id => (
											<Row key={id} icon={iconFor(id)} label={nodeLabel(id)} hint={'Start can’t reach this node'}>
												<Button
													type='button'
													size='xs'
													colorPalette='red'
													variant='outline'
													onClick={() => remove([id])}
												>
													{'Remove'}
												</Button>
											</Row>
										))}
									</Section>
								)}

								{warnings.size > 0 && (
									<Section title='Configuration warnings'>
										{[...warnings.entries()].flatMap(([id, list]) =>
											list.map(w => (
												<Row key={`${id}:${w.kind}`} icon={iconFor(id)} label={nodeLabel(id)} hint={w.message}>
													<Button type='button' size='xs' variant='outline' onClick={() => jump(id)}>
														{'Fix →'}
													</Button>
												</Row>
											)),
										)}
									</Section>
								)}
							</Stack>
						)}
					</Dialog.Body>
					<Dialog.Footer>
						<Button variant='ghost' size='sm' onClick={onClose}>
							{'Close'}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
};

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
	<Stack gap='1.5'>
		<Box
			fontSize='10px'
			fontWeight='700'
			color='fg.muted'
			textTransform='uppercase'
			letterSpacing='0.06em'
		>
			{title}
		</Box>
		<Stack gap='1'>{children}</Stack>
	</Stack>
);

interface RowProps {
	icon: React.ReactNode;
	label: string;
	hint: string;
}

const Row: React.FC<React.PropsWithChildren<RowProps>> = ({ icon, label, hint, children }) => (
	<Flex
		align='center'
		gap='2'
		px='2'
		py='1.5'
		bg='bg.subtle'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
	>
		<Flex
			align='center'
			justify='center'
			w='22px'
			h='22px'
			flexShrink={0}
			borderRadius='sm'
			color='accent.warning'
			bg='color-mix(in srgb, var(--beak-colors-accent-warning) 12%, transparent)'
		>
			{icon}
		</Flex>
		<Stack gap='0' flex='1' minW={0}>
			<Box fontSize='12px' fontWeight='600' color='fg.default'>
				{label}
			</Box>
			<Box fontSize='10px' color='fg.subtle'>
				{hint}
			</Box>
		</Stack>
		{children}
	</Flex>
);

export default QuickFixDialog;
