import { Box, Flex } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import { AlertOctagon, CheckCircle2, FolderGit2, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../components/atoms/Button';
import Dialog from '../../../components/molecules/Dialog';
import Input from '../../../components/atoms/Input';
import { cloneRepo, openClonedProject } from '../lib/clone';
import { actions } from '../store';

const embedded = Boolean(window.embeddedIndicator);

const CloneRepoDialog: React.FC = () => {
	const dispatch = useDispatch();
	const state = useAppSelector(s => s.features.cloneRepo?.current);

	// While in `cloning`, dispatch the IPC clone and resolve to success / failure.
	useEffect(() => {
		if (!state || state.phase !== 'cloning') return;
		let cancelled = false;
		cloneRepo({ url: state.url, targetName: state.targetName })
			.then(outcome => {
				if (cancelled) return;
				if (outcome.ok) {
					dispatch(actions.cloneSucceeded({ dir: outcome.dir, openable: outcome.openable }));
				} else {
					dispatch(actions.cloneFailed({ error: outcome.error }));
				}
			})
			.catch(err => {
				if (cancelled) return;
				dispatch(actions.cloneFailed({ error: err instanceof Error ? err.message : String(err) }));
			});
		return () => {
			cancelled = true;
		};
	}, [state, dispatch]);

	if (!state || state.phase === 'idle') return null;

	function onClose() {
		dispatch(actions.close());
	}

	return (
		<Dialog onClose={onClose} tone='indigo' size='md'>
			<Box p='5' minW='460px' maxW='520px'>
				<Flex align='center' gap='3' mb='4'>
					<Flex
						align='center'
						justify='center'
						w='34px'
						h='34px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
						color='accent.indigo'
					>
						<FolderGit2 size={16} strokeWidth={2.2} />
					</Flex>
					<Box flex='1 1 auto'>
						<Box fontSize='md' fontWeight='700' color='fg.default' letterSpacing='-0.005em'>
							{'Clone a Beak project'}
						</Box>
						<Box fontSize='xs' color='fg.muted'>
							{'Pull a Beak project from a Git remote and open it locally.'}
						</Box>
					</Box>
				</Flex>

				{state.phase === 'configuring' && (
					<ConfigureForm
						url={state.url}
						targetName={state.targetName}
						error={state.error}
						onUrlChange={v => dispatch(actions.updateUrl(v))}
						onTargetNameChange={v => dispatch(actions.updateTargetName(v))}
						onCancel={onClose}
						onSubmit={() => {
							const url = state.url.trim();
							const name = state.targetName.trim();
							if (!url) {
								dispatch(actions.validationFailed({ error: 'Enter a repo URL.' }));
								return;
							}
							if (!name) {
								dispatch(actions.validationFailed({ error: 'Pick a target folder name.' }));
								return;
							}
							dispatch(actions.cloneSubmitted({ url, targetName: name, dir: '' }));
						}}
					/>
				)}

				{state.phase === 'cloning' && (
					<CloningProgress url={state.url} targetName={state.targetName} />
				)}

				{state.phase === 'result' && (
					<ResultPanel
						outcome={state.outcome}
						onCancel={onClose}
						onOpen={async () => {
							if (state.outcome.ok) {
								await openClonedProject(state.outcome.dir);
								dispatch(actions.close());
							}
						}}
					/>
				)}
			</Box>
		</Dialog>
	);
};

interface ConfigureFormProps {
	url: string;
	targetName: string;
	error?: string;
	onUrlChange: (v: string) => void;
	onTargetNameChange: (v: string) => void;
	onCancel: () => void;
	onSubmit: () => void;
}

const ConfigureForm: React.FC<ConfigureFormProps> = ({
	url,
	targetName,
	error,
	onUrlChange,
	onTargetNameChange,
	onCancel,
	onSubmit,
}) => (
	<Flex direction='column' gap='3'>
		<Flex direction='column' gap='1'>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
				{'Repo URL'}
			</Box>
			<Input
				$beakSize='md'
				value={url}
				placeholder='https://github.com/getbeak/sample-project.git'
				onChange={e => onUrlChange(e.currentTarget.value)}
				autoFocus
			/>
		</Flex>
		<Flex direction='column' gap='1'>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
				{embedded ? 'Folder name' : 'Project name'}
			</Box>
			<Input
				$beakSize='md'
				value={targetName}
				placeholder='my-cool-api'
				onChange={e => onTargetNameChange(e.currentTarget.value)}
			/>
			<Box fontSize='10px' color='fg.subtle'>
				{embedded
					? 'You’ll pick the parent folder next; this name becomes the subfolder.'
					: 'Stored in the in-browser project filesystem.'}
			</Box>
		</Flex>
		{error && (
			<Flex align='center' gap='1.5' color='accent.alert' fontSize='xs'>
				<AlertOctagon size={12} />
				<Box color='fg.default'>{error}</Box>
			</Flex>
		)}
		<Flex justify='flex-end' gap='2' mt='1'>
			<Button size='sm' colour='secondary' onClick={onCancel}>
				{'Cancel'}
			</Button>
			<Button onClick={onSubmit}>{'Continue'}</Button>
		</Flex>
	</Flex>
);

const CloningProgress: React.FC<{ url: string; targetName: string }> = ({ url, targetName }) => (
	<Flex direction='column' align='center' gap='3' py='4'>
		<Box
			css={{
				animation: 'cr-spin 1.1s linear infinite',
				'@keyframes cr-spin': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' },
				},
			}}
			color='accent.indigo'
		>
			<Loader2 size={24} />
		</Box>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{'Cloning…'}
		</Box>
		<Box fontSize='xs' fontFamily='mono' color='fg.muted' textAlign='center' wordBreak='break-all'>
			{url}
		</Box>
		<Box fontSize='10px' color='fg.subtle'>
			{`into ${targetName}`}
		</Box>
	</Flex>
);

interface ResultPanelProps {
	outcome: { ok: true; dir: string; openable: boolean } | { ok: false; error: string };
	onCancel: () => void;
	onOpen: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ outcome, onCancel, onOpen }) => {
	if (!outcome.ok) {
		return (
			<Flex direction='column' gap='3'>
				<Flex align='center' gap='2' color='accent.alert'>
					<AlertOctagon size={14} />
					<Box fontSize='sm' fontWeight='600' color='fg.default'>
						{'Clone failed'}
					</Box>
				</Flex>
				<Box
					p='3'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 30%, transparent)'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 8%, transparent)'
					fontSize='xs'
					color='fg.default'
					fontFamily='mono'
				>
					{outcome.error}
				</Box>
				<Flex justify='flex-end'>
					<Button size='sm' colour='secondary' onClick={onCancel}>
						{'Close'}
					</Button>
				</Flex>
			</Flex>
		);
	}

	return (
		<Flex direction='column' gap='3'>
			<Flex align='center' gap='2' color='accent.teal'>
				<CheckCircle2 size={14} />
				<Box fontSize='sm' fontWeight='600' color='fg.default'>
					{'Cloned successfully'}
				</Box>
			</Flex>
			<Box
				p='3'
				borderWidth='1px'
				borderColor='border.subtle'
				borderRadius='md'
				bg='bg.surface'
				fontSize='xs'
				color='fg.muted'
				fontFamily='mono'
				wordBreak='break-all'
			>
				{outcome.dir}
			</Box>
			<Flex justify='flex-end' gap='2'>
				<Button size='sm' colour='secondary' onClick={onCancel}>
					{'Stay here'}
				</Button>
				<Button onClick={onOpen}>{'Open project'}</Button>
			</Flex>
		</Flex>
	);
};

export default CloneRepoDialog;
