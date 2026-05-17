import { inspectGraph, nodeBounds, validateWorkflow, type WorkflowFile, workflowStats } from '@beak/state/workflows';
import { Box, Button, Dialog, Flex, Stack } from '@chakra-ui/react';
import * as React from 'react';
import { useMemo } from 'react';

interface StatsDialogProps {
	workflow: WorkflowFile;
	open: boolean;
	onClose: () => void;
}

/**
 * Stats summary modal. Reads `workflowStats` from @beak/state — pure
 * helper, so all the counting logic lives there + is tested. The UI
 * just lays them out.
 */
const StatsDialog: React.FC<StatsDialogProps> = ({ workflow, open, onClose }) => {
	const stats = useMemo(() => workflowStats(workflow), [workflow]);
	const bounds = useMemo(() => nodeBounds(workflow.nodes), [workflow.nodes]);
	const health = useMemo(() => inspectGraph(workflow), [workflow]);
	const warnings = useMemo(() => validateWorkflow(workflow), [workflow]);
	const totalIssues =
		health.unreachable.length + health.unlinkedRequestNodes.length + health.cycleNodes.length + warnings.size;

	return (
		<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='md' placement='center'>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{'Workflow stats'}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<Stack gap='3'>
							{(workflow.description?.trim() || (workflow.tags && workflow.tags.length > 0)) && (
								<Section title='Meta'>
									{workflow.description?.trim() && (
										<Box fontSize='12px' color='fg.default' lineHeight='1.45' px='2' py='1'>
											{workflow.description.trim()}
										</Box>
									)}
									{workflow.tags && workflow.tags.length > 0 && (
										<Flex gap='1' flexWrap='wrap' px='2'>
											{workflow.tags.map(tag => (
												<Box
													key={tag}
													fontSize='10px'
													px='1.5'
													py='0.5'
													borderRadius='sm'
													borderWidth='1px'
													borderColor='border.subtle'
													bg='bg.canvas'
													color='fg.muted'
												>
													{`#${tag}`}
												</Box>
											))}
										</Flex>
									)}
								</Section>
							)}

							<Section title='Nodes by kind'>
								{Object.entries(stats.nodesByKind)
									.filter(([, count]) => count > 0)
									.map(([kind, count]) => (
										<Row key={kind} label={kind}>
											<Count value={count} />
										</Row>
									))}
								{Object.values(stats.nodesByKind).every(c => c === 0) && (
									<Box fontSize='12px' color='fg.subtle'>
										{'No nodes yet.'}
									</Box>
								)}
							</Section>

							<Section title='Edges'>
								<Row label='Total'>
									<Count value={stats.edgeCount} />
								</Row>
								{Object.entries(stats.edgesByHandle).map(([handle, count]) => (
									<Row key={handle || '(unhandled)'} label={handle || '(unhandled)'}>
										<Count value={count} />
									</Row>
								))}
							</Section>

							<Section title='Health'>
								<Row label='Components'>
									<Count value={stats.componentCount} />
								</Row>
								<Row label='Linked requests'>
									<Count value={stats.linkedRequestCount} />
								</Row>
								<Row label='Unlinked requests'>
									<Count value={stats.unlinkedRequestCount} />
								</Row>
							</Section>

							<Section title='Issues'>
								{totalIssues === 0 ? (
									<Box fontSize='12px' color='accent.success'>
										{'Clean. No structural or config warnings.'}
									</Box>
								) : (
									<>
										<Row label='Unreachable nodes'>
											<Count value={health.unreachable.length} />
										</Row>
										<Row label='Unlinked requests'>
											<Count value={health.unlinkedRequestNodes.length} />
										</Row>
										<Row label='Cycle members'>
											<Count value={health.cycleNodes.length} />
										</Row>
										<Row label='Per-node warnings'>
											<Count value={warnings.size} />
										</Row>
									</>
								)}
							</Section>

							{bounds && (
								<Section title='Canvas bounds'>
									<Row label='Width'>
										<Count value={Math.round(bounds.width)} />
									</Row>
									<Row label='Height'>
										<Count value={Math.round(bounds.height)} />
									</Row>
								</Section>
							)}
						</Stack>
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
		<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
			{title}
		</Box>
		<Stack gap='0.5'>{children}</Stack>
	</Stack>
);

const Row: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
	<Flex align='center' gap='2' px='2' py='1' bg='bg.subtle' borderRadius='sm'>
		<Box fontSize='12px' color='fg.default' flex='1' textTransform='capitalize'>
			{label}
		</Box>
		{children}
	</Flex>
);

const Count: React.FC<{ value: number }> = ({ value }) => (
	<Box fontSize='12px' fontWeight='600' color='fg.default' fontVariantNumeric='tabular-nums'>
		{value}
	</Box>
);

export default StatsDialog;
