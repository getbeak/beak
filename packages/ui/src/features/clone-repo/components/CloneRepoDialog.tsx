import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { AlertOctagon, CheckCircle2, FolderGit2, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '../../../components/molecules/Dialog';
import { cloneRepo, openClonedProject } from '../lib/clone';
import { actions } from '../store';

const embedded = Boolean(window.embeddedIndicator);

const CloneRepoDialog: React.FC = () => {
	const dispatch = useDispatch();
	const state = useAppSelector(s => s.features.cloneRepo?.current);

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
			<Box minW='480px' maxW='540px'>
				<DialogHeader
					icon={<FolderGit2 size={14} strokeWidth={2.2} />}
					title='Clone a Beak project'
					description='Pull a Beak project from a Git remote and open it locally.'
				/>

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

				{state.phase === 'cloning' && <CloningProgress url={state.url} targetName={state.targetName} />}

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
	<React.Fragment>
		<DialogBody>
			<Flex direction='column' gap='3'>
				<FormField label='Repo URL'>
					<Input
						$beakSize='md'
						value={url}
						placeholder='https://github.com/getbeak/sample-project.git'
						onChange={e => onUrlChange(e.currentTarget.value)}
						autoFocus
					/>
				</FormField>
				<FormField
					label={embedded ? 'Folder name' : 'Project name'}
					helper={
						embedded
							? 'You’ll pick the parent folder next; this name becomes the subfolder.'
							: 'Stored in the in-browser project filesystem.'
					}
				>
					<Input
						$beakSize='md'
						value={targetName}
						placeholder='my-cool-api'
						onChange={e => onTargetNameChange(e.currentTarget.value)}
					/>
				</FormField>
				{error && (
					<Flex
						align='center'
						gap='2'
						px='2.5'
						py='1.5'
						borderRadius='md'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 38%, var(--beak-colors-border-subtle))'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
						fontSize='xs'
					>
						<Box color='accent.alert' flex='0 0 auto'>
							<AlertOctagon size={13} />
						</Box>
						<Box color='fg.default'>{error}</Box>
					</Flex>
				)}
			</Flex>
		</DialogBody>
		<DialogFooter>
			<Button size='sm' colour='secondary' onClick={onCancel}>
				{'Cancel'}
			</Button>
			<Button size='sm' onClick={onSubmit}>
				{'Continue'}
			</Button>
		</DialogFooter>
	</React.Fragment>
);

const CloningProgress: React.FC<{ url: string; targetName: string }> = ({ url, targetName }) => (
	<DialogBody>
		<Flex direction='column' align='center' gap='2' py='4'>
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
				<Loader2 size={22} />
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
	</DialogBody>
);

interface ResultPanelProps {
	outcome: { ok: true; dir: string; openable: boolean } | { ok: false; error: string };
	onCancel: () => void;
	onOpen: () => void;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ outcome, onCancel, onOpen }) => {
	if (!outcome.ok) {
		return (
			<React.Fragment>
				<DialogBody>
					<Flex align='center' gap='2' color='accent.alert' mb='2'>
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
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, transparent)'
						fontSize='xs'
						color='fg.default'
						fontFamily='mono'
						wordBreak='break-word'
					>
						{outcome.error}
					</Box>
				</DialogBody>
				<DialogFooter>
					<Button size='sm' colour='secondary' onClick={onCancel}>
						{'Close'}
					</Button>
				</DialogFooter>
			</React.Fragment>
		);
	}

	return (
		<React.Fragment>
			<DialogBody>
				<Flex align='center' gap='2' color='accent.teal' mb='2'>
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
					bg='bg.canvas'
					fontSize='xs'
					color='fg.muted'
					fontFamily='mono'
					wordBreak='break-all'
				>
					{outcome.dir}
				</Box>
			</DialogBody>
			<DialogFooter>
				<Button size='sm' colour='secondary' onClick={onCancel}>
					{'Stay here'}
				</Button>
				<Button size='sm' onClick={onOpen}>
					{'Open project'}
				</Button>
			</DialogFooter>
		</React.Fragment>
	);
};

interface FormFieldProps {
	label: string;
	helper?: string;
}

const FormField: React.FC<React.PropsWithChildren<FormFieldProps>> = ({ label, helper, children }) => (
	<Flex direction='column' gap='1'>
		<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
			{label}
		</Box>
		{children}
		{helper && (
			<Box fontSize='11px' color='fg.subtle'>
				{helper}
			</Box>
		)}
	</Flex>
);

export default CloneRepoDialog;
