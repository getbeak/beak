import { recentWorkflows, summariseWorkflow } from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { sidebarPreferenceSetCollapse, sidebarPreferenceSetSelected } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Home, Plug, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

/**
 * Project home is currently a thin landing page. OpenAPI sync sources moved
 * into the Schemas sidebar alongside GraphQL + gRPC — see SourceSchemasPane.
 * This page lingers as a future home for project-level controls that don't
 * fit elsewhere; for now it points at the sidebar so users who land here
 * (via the menu, a stale tab, the welcome screen) aren't stranded.
 */
const ProjectHome: React.FC = () => {
	const dispatch = useDispatch();
	const projectName = useAppSelector(s => s.global.project.name) ?? 'Project';
	const isMemory = useAppSelector(s => s.global.project.mode === 'memory');
	const workflows = useAppSelector(s => s.global.workflows.workflows);
	const recentFlows = recentWorkflows(workflows, 5);
	const workflowCount = Object.keys(workflows).length;

	function openEndpointsSidebar() {
		dispatch(sidebarPreferenceSetCollapse({ key: 'sidebar', collapsed: false }));
		dispatch(sidebarPreferenceSetSelected('schemas'));
	}

	return (
		<Box h='100%' overflowY='auto' bg='bg.canvas'>
			<Box maxW='720px' mx='auto' px='8' pt='9' pb='12'>
				<Flex align='center' gap='3' mb='1'>
					<Flex
						align='center'
						justify='center'
						w='38px'
						h='38px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 26%, transparent)'
						color='accent.teal'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-teal) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Home size={18} strokeWidth={2} />
					</Flex>
					<Box>
						<Box fontSize='3xl' fontWeight='700' letterSpacing='-0.02em' lineHeight='1.05' color='fg.default'>
							{projectName}
						</Box>
						{isMemory && (
							<Box fontSize='10px' color='accent.pink' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
								{'Untitled project'}
							</Box>
						)}
					</Box>
				</Flex>
				<Box fontSize='sm' color='fg.subtle' mt='1' mb='6'>
					{workflowCount === 0
						? 'Project-level controls land here as they’re built.'
						: `${workflowCount} workflow${workflowCount === 1 ? '' : 's'} · project-level controls land here.`}
				</Box>

				<ChakraButton
					type='button'
					display='flex'
					alignItems='center'
					gap='3'
					p='4'
					w='100%'
					borderWidth='1px'
					borderColor='border.subtle'
					borderRadius='md'
					bg='bg.surface'
					textAlign='left'
					cursor='pointer'
					transition='border-color .12s ease, background-color .12s ease'
					_hover={{
						borderColor: 'accent.pink',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, var(--beak-colors-bg-surface))',
					}}
					onClick={openEndpointsSidebar}
				>
					<Flex
						align='center'
						justify='center'
						w='34px'
						h='34px'
						borderRadius='sm'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
						color='accent.pink'
						flexShrink={0}
					>
						<Plug size={16} strokeWidth={2} />
					</Flex>
					<Box flex='1' minW={0}>
						<Box fontSize='sm' fontWeight='600' color='fg.default'>
							{'Schema sources'}
						</Box>
						<Box fontSize='12px' color='fg.muted' mt='0.5' lineHeight='1.45'>
							{
								'Connect a GraphQL endpoint, a gRPC service, or an OpenAPI spec — Beak imports every operation as a request and keeps OpenAPI folders in sync. Click here to open the sidebar.'
							}
						</Box>
					</Box>
				</ChakraButton>

				{recentFlows.length > 0 && (
					<Box mt='8'>
						<Box
							fontSize='10px'
							fontWeight='700'
							color='fg.muted'
							letterSpacing='0.08em'
							textTransform='uppercase'
							mb='2'
						>
							{'Recent workflows'}
						</Box>
						<Flex direction='column' gap='1.5'>
							{recentFlows.map(wf => {
								const summary = summariseWorkflow(wf);
								return (
									<ChakraButton
										type='button'
										key={wf.id}
										onClick={() =>
											dispatch(changeTab({ type: 'workflow_editor', payload: wf.id, temporary: false }))
										}
										display='flex'
										alignItems='center'
										gap='3'
										p='3'
										w='100%'
										minW={0}
										borderWidth='1px'
										borderColor='border.subtle'
										borderRadius='md'
										bg='bg.surface'
										textAlign='left'
										cursor='pointer'
										transition='border-color .12s ease, background-color .12s ease'
										_hover={{
											borderColor: 'accent.pink',
											bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, var(--beak-colors-bg-surface))',
										}}
									>
										<Flex
											align='center'
											justify='center'
											w='28px'
											h='28px'
											borderRadius='sm'
											bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
											borderWidth='1px'
											borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
											color='accent.pink'
											flexShrink={0}
										>
											<WorkflowIcon size={13} strokeWidth={2} />
										</Flex>
										<Box flex='1' minW={0}>
											<Box
												fontSize='sm'
												fontWeight='600'
												color='fg.default'
												overflow='hidden'
												textOverflow='ellipsis'
												whiteSpace='nowrap'
											>
												{wf.name || 'Untitled workflow'}
											</Box>
											{summary && (
												<Box
													fontSize='11.5px'
													color='fg.muted'
													mt='0.5'
													overflow='hidden'
													textOverflow='ellipsis'
													whiteSpace='nowrap'
												>
													{summary}
												</Box>
											)}
										</Box>
									</ChakraButton>
								);
							})}
						</Flex>
					</Box>
				)}
			</Box>
		</Box>
	);
};

const ChakraButton = chakra('button');

export default ProjectHome;
