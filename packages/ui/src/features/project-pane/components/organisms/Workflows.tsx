import { inspectGraph } from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

/**
 * Workflows sidebar section — mirrors the VariableSets row look so the two
 * project-level "global" lists feel like siblings. Click a row to open the
 * workflow editor tab. The section is rendered unconditionally so the
 * "+ New workflow" action button at the bottom is always reachable; an
 * empty list shows a one-line nudge instead.
 */
const Workflows: React.FC = () => {
	const dispatch = useDispatch();
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const workflows = useAppSelector(s => s.global.workflows.workflows);
	const entries = Object.values(workflows);

	if (entries.length === 0) {
		return (
			<Box px='3' py='2' fontSize='11px' color='fg.subtle' lineHeight='1.45'>
				{'Chain requests together. Use the workflow icon at the top of the explorer to add one.'}
			</Box>
		);
	}

	return (
		<Flex direction='column' minW={0}>
			{entries.map(wf => {
				const isActive = selectedTabId === wf.id;
				const nodeCount = wf.nodes.length;
				const health = inspectGraph(wf);
				const issueCount = health.unreachable.length + health.unlinkedRequestNodes.length + health.cycleNodes.length;
				const dotColor =
					issueCount > 0
						? 'var(--beak-colors-accent-warning)'
						: nodeCount > 1
							? 'var(--beak-colors-accent-success)'
							: 'var(--beak-colors-fg-subtle)';
				return (
					<ChakraButton
						type='button'
						key={wf.id}
						onClick={() => dispatch(changeTab({ type: 'workflow_editor', payload: wf.id, temporary: true }))}
						onDoubleClick={() => dispatch(changeTab({ type: 'workflow_editor', payload: wf.id, temporary: false }))}
						onContextMenu={event => {
							event.preventDefault();
							dispatch(workflowActions.removeWorkflowFromDisk({ id: wf.id, withConfirmation: true }));
						}}
						display='flex'
						alignItems='center'
						gap='2'
						w='100%'
						minW={0}
						h='26px'
						px='3'
						border='none'
						bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)' : 'transparent'}
						color={isActive ? 'accent.pink' : 'fg.default'}
						fontSize='12px'
						fontWeight='500'
						textAlign='left'
						cursor='pointer'
						transition='background-color .1s linear, color .1s linear'
						_hover={{
							bg: isActive
								? 'color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
								: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
						}}
					>
						<Flex
							align='center'
							justify='center'
							w='14px'
							h='14px'
							flexShrink={0}
							color={isActive ? 'accent.pink' : 'fg.subtle'}
							position='relative'
						>
							<WorkflowIcon size={11} strokeWidth={1.8} />
							<Box
								position='absolute'
								top='-1px'
								right='-1px'
								w='6px'
								h='6px'
								borderRadius='full'
								bg={dotColor}
								borderWidth='1.5px'
								borderColor='bg.surface'
							/>
						</Flex>
						<Box flex='1 1 auto' minW={0} overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
							{wf.name || 'Untitled workflow'}
						</Box>
						{wf.tags && wf.tags.length > 0 && (
							<Flex gap='1' flexShrink={0} alignItems='center'>
								{wf.tags.slice(0, 2).map(tag => (
									<Box
										key={tag}
										fontSize='9px'
										px='1'
										h='14px'
										display='inline-flex'
										alignItems='center'
										borderRadius='sm'
										borderWidth='1px'
										borderColor='border.subtle'
										bg='bg.canvas'
										color='fg.muted'
									>
										{tag}
									</Box>
								))}
								{wf.tags.length > 2 && (
									<Box fontSize='9px' color='fg.subtle'>
										{`+${wf.tags.length - 2}`}
									</Box>
								)}
							</Flex>
						)}
						<Box
							as='span'
							flexShrink={0}
							fontSize='10.5px'
							fontVariantNumeric='tabular-nums'
							color={isActive ? 'accent.pink' : 'fg.subtle'}
							opacity={0.7}
							title={
								issueCount > 0
									? `${issueCount} issue${issueCount === 1 ? '' : 's'}`
									: undefined
							}
						>
							{issueCount > 0 ? `${issueCount} issue${issueCount === 1 ? '' : 's'}` : `${nodeCount} step${nodeCount === 1 ? '' : 's'}`}
						</Box>
					</ChakraButton>
				);
			})}
		</Flex>
	);
};

export default Workflows;
