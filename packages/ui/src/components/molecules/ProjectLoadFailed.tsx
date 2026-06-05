import type { SerializedSquawk } from '@beak/squawk';
import { startProject } from '@beak/state/project';
import Button from '@beak/ui/components/atoms/Button';
import EditorView from '@beak/ui/components/atoms/EditorView';
import { ipcExplorerService, ipcWindowService } from '@beak/ui/lib/ipc';
import { Box, Flex } from '@chakra-ui/react';
import { FileWarning, FolderOpen, RefreshCw, X } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

interface ProjectLoadFailedProps {
	error: SerializedSquawk;
}

function titleForKind(kind: string): string {
	switch (kind) {
		case 'project_legacy':
			return 'Project is too old for this version of Beak';
		case 'project_future':
			return 'Project was saved by a newer Beak';
		case 'schema_invalid':
			return 'Project file is invalid';
		default:
			return 'Could not open this project';
	}
}

function helperForKind(kind: string): string {
	switch (kind) {
		case 'project_legacy':
			return 'The project file references a version Beak no longer supports. Reach out to @beakapp on twitter if you need help migrating.';
		case 'project_future':
			return 'Update Beak to the latest version and try again.';
		case 'schema_invalid':
			return 'project.json doesn’t match the expected shape. The field errors below point to what to fix — open the file in your editor, save the fix, then retry.';
		default:
			return 'Something went wrong while loading the project. The details below may help diagnose.';
	}
}

const ProjectLoadFailed: React.FC<ProjectLoadFailedProps> = ({ error }) => {
	const dispatch = useDispatch();
	const [retrying, setRetrying] = useState(false);

	const fieldErrors = (error.meta?.fieldErrors ?? {}) as Record<string, string>;
	const fieldEntries = Object.entries(fieldErrors);

	const handleRetry = () => {
		if (retrying) return;
		setRetrying(true);
		dispatch(startProject());
		// The startProject effect dispatches either projectOpened (loadError
		// clears, this component unmounts) or projectLoadFailed again. Either
		// way the spinner finishes within one effect tick — release after a
		// short delay so the user sees the click landed.
		window.setTimeout(() => setRetrying(false), 600);
	};

	return (
		<Flex role='alert' position='absolute' inset='0' zIndex={120} align='center' justify='center' bg='bg.canvas' p='6'>
			<Flex
				direction='column'
				maxW='640px'
				w='100%'
				bg='bg.surface'
				borderWidth='1px'
				borderColor='border.subtle'
				borderRadius='lg'
				overflow='hidden'
				boxShadow='0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)'
			>
				<Flex align='center' gap='3' px='5' py='4' borderBottomWidth='1px' borderColor='border.subtle'>
					<Flex
						align='center'
						justify='center'
						w='32px'
						h='32px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 16%, transparent)'
						color='accent.alert'
						flex='0 0 auto'
					>
						<FileWarning size={16} strokeWidth={2.2} />
					</Flex>
					<Flex direction='column' minW={0}>
						<Box fontSize='md' fontWeight='600' color='fg.default' lineHeight='1.2'>
							{titleForKind(error.kind)}
						</Box>
						<Box fontSize='xs' color='fg.muted' fontFamily='mono' mt='0.5'>
							{error.kind}
						</Box>
					</Flex>
				</Flex>

				<Box px='5' py='4' fontSize='sm' color='fg.muted' lineHeight='1.5'>
					{helperForKind(error.kind)}
				</Box>

				<Box
					mx='5'
					mb='4'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, transparent)'
					px='3'
					py='2'
					fontSize='xs'
					color='fg.default'
					fontFamily='mono'
					wordBreak='break-word'
				>
					{error.message}
				</Box>

				{fieldEntries.length > 0 && (
					<Box mx='5' mb='4'>
						<Box
							fontSize='10px'
							fontWeight='700'
							color='accent.alert'
							textTransform='uppercase'
							letterSpacing='0.06em'
							mb='1.5'
						>
							{`${fieldEntries.length} field ${fieldEntries.length === 1 ? 'error' : 'errors'}`}
						</Box>
						<Flex direction='column' gap='1'>
							{fieldEntries.map(([fieldPath, msg]) => (
								<Flex key={fieldPath} align='flex-start' gap='2' fontSize='xs' fontFamily='mono'>
									<Box
										flex='0 0 auto'
										color='accent.pink'
										fontWeight='600'
										minW='140px'
										maxW='240px'
										overflow='hidden'
										textOverflow='ellipsis'
										whiteSpace='nowrap'
									>
										{fieldPath || '(root)'}
									</Box>
									<Box color='fg.default' wordBreak='break-word'>
										{msg}
									</Box>
								</Flex>
							))}
						</Flex>
					</Box>
				)}

				<Box
					as='details'
					mx='5'
					mb='4'
					borderTopWidth='1px'
					borderColor='border.subtle'
					pt='3'
					css={{
						'& > summary': {
							cursor: 'pointer',
							fontSize: 10,
							fontWeight: 700,
							color: 'var(--beak-colors-fg-subtle)',
							textTransform: 'uppercase',
							letterSpacing: '0.06em',
						},
						'& > summary:hover': { color: 'var(--beak-colors-accent-pink)' },
					}}
				>
					<summary>{'Raw error payload'}</summary>
					<Box mt='2' h='220px' borderWidth='1px' borderColor='border.subtle' borderRadius='md' overflow='hidden'>
						<EditorView
							language='json'
							value={JSON.stringify(error, null, '\t')}
							options={{ readOnly: true, lineNumbers: 'off' }}
						/>
					</Box>
				</Box>

				<Flex
					gap='2'
					px='5'
					py='3'
					borderTopWidth='1px'
					borderColor='border.subtle'
					bg='bg.canvas'
					justify='flex-end'
					wrap='wrap'
				>
					<Button onClick={() => ipcWindowService.closeSelfWindow()}>
						<Flex align='center' gap='1.5'>
							<X size={12} strokeWidth={2.2} />
							{'Close window'}
						</Flex>
					</Button>
					<Button onClick={() => ipcExplorerService.revealFile('project.json')}>
						<Flex align='center' gap='1.5'>
							<FolderOpen size={12} strokeWidth={2.2} />
							{'Reveal in Finder'}
						</Flex>
					</Button>
					<Button onClick={handleRetry} disabled={retrying}>
						<Flex align='center' gap='1.5'>
							<RefreshCw size={12} strokeWidth={2.2} />
							{retrying ? 'Retrying…' : 'Try again'}
						</Flex>
					</Button>
				</Flex>
			</Flex>
		</Flex>
	);
};

export default ProjectLoadFailed;
