import {
	operationDismissed,
	requestCommit,
	requestFetch,
	requestPull,
	requestPush,
	requestStatus,
} from '@beak/state/git';
import { Box, Flex } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import { GitCommitVertical } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../components/atoms/Button';
import Dialog from '../../../components/molecules/Dialog';
import Input from '../../../components/atoms/Input';
import { useGitAuthor } from '../hooks/use-git-author';
import { closeSourceControl } from '../store';
import AuthorFields from './molecules/AuthorFields';
import BranchInfo from './molecules/BranchInfo';
import FileChangesList from './molecules/FileChangesList';
import OperationStatus from './molecules/OperationStatus';
import RemotesPanel from './molecules/RemotesPanel';

const SourceControlDialog: React.FC = () => {
	const dispatch = useDispatch();
	const open = useAppSelector(s => s.features.sourceControl?.open ?? false);
	const git = useAppSelector(s => s.global.git);
	const { author, setAuthor } = useGitAuthor();
	const [message, setMessage] = useState('');

	const pending = git.operation.phase === 'pending';
	const dirty = (git.status?.files.length ?? 0) > 0;
	const canCommit =
		!pending &&
		message.trim().length > 0 &&
		author.name.trim().length > 0 &&
		author.email.trim().length > 0 &&
		dirty;

	// Refresh status whenever the dialog opens. Cheap — IPC round-trip with
	// a status-matrix is fast enough for an interactive UI.
	useEffect(() => {
		if (!open) return;
		if (!git.available) return;
		dispatch(requestStatus());
	}, [open, git.available, dispatch]);

	// Clear the commit message after a successful commit so the user gets a
	// fresh field. Keep the form open so they can see the success notice.
	useEffect(() => {
		if (git.operation.phase === 'success' && git.operation.op === 'commit') {
			setMessage('');
		}
	}, [git.operation]);

	function onClose() {
		dispatch(closeSourceControl());
	}

	function onCommit() {
		if (!canCommit) return;
		dispatch(operationDismissed());
		dispatch(
			requestCommit({
				message: message.trim(),
				author: { name: author.name.trim(), email: author.email.trim() },
			}),
		);
	}

	function onPush() {
		dispatch(operationDismissed());
		dispatch(requestPush({}));
	}

	function onPull() {
		dispatch(operationDismissed());
		dispatch(requestPull({ author: { name: author.name.trim(), email: author.email.trim() } }));
	}

	function onFetch() {
		dispatch(operationDismissed());
		dispatch(requestFetch({}));
	}

	if (!open) return null;

	return (
		<Dialog onClose={onClose} size='lg' tone='indigo'>
			<Box p='5' minW='560px' maxW='640px'>
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
						<GitCommitVertical size={16} strokeWidth={2.2} />
					</Flex>
					<Box flex='1 1 auto'>
						<Box fontSize='md' fontWeight='700' color='fg.default' letterSpacing='-0.005em'>
							{'Source control'}
						</Box>
						<Box fontSize='xs' color='fg.muted'>
							{'Commit, push, pull — everything happens against the project root.'}
						</Box>
					</Box>
				</Flex>

				{!git.available ? (
					<Box
						p='4'
						borderWidth='1px'
						borderStyle='dashed'
						borderColor='border.subtle'
						borderRadius='md'
						bg='bg.surface'
						color='fg.muted'
						fontSize='sm'
					>
						{'This project isn’t a git repo yet. Run `git init` in the project folder (desktop) or clone an existing repo from the welcome screen.'}
					</Box>
				) : (
					<Flex direction='column' gap='4'>
						<Flex align='center' justify='space-between' wrap='wrap' gap='3'>
							<BranchInfo branch={git.selectedBranch} branchCount={git.branches.length} />
							<Flex
								px='2.5'
								py='1.5'
								borderRadius='full'
								borderWidth='1px'
								borderColor='border.subtle'
								bg='bg.surface'
								gap='2.5'
								fontSize='10px'
								fontWeight='700'
								letterSpacing='0.04em'
								textTransform='uppercase'
								color='fg.muted'
							>
								<Box>
									{`${git.status?.staged ?? 0} staged`}
								</Box>
								<Box>
									{`${git.status?.unstaged ?? 0} unstaged`}
								</Box>
								<Box>
									{`${git.status?.untracked ?? 0} new`}
								</Box>
							</Flex>
						</Flex>

						<FileChangesList files={git.status?.files ?? []} loading={git.statusLoading} />

						<OperationStatus state={git.operation} />

						<Box>
							<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle' mb='1'>
								{'Commit message'}
							</Box>
							<Input
								$beakSize='md'
								value={message}
								placeholder='Describe the change'
								onChange={e => setMessage(e.currentTarget.value)}
								disabled={pending}
							/>
						</Box>

						<AuthorFields author={author} onChange={setAuthor} disabled={pending} />

						<Flex justify='flex-end' gap='2'>
							<Button size='sm' colour='secondary' onClick={onClose} disabled={pending}>
								{'Close'}
							</Button>
							<Button onClick={onCommit} disabled={!canCommit}>
								{`Commit ${git.status?.files.length ? `${git.status.files.length} file${git.status.files.length === 1 ? '' : 's'}` : ''}`.trim()}
							</Button>
						</Flex>

						<Box h='1px' bg='border.subtle' />

						<RemotesPanel
							remotes={git.remotes}
							currentBranch={git.selectedBranch}
							disabled={pending}
							onPush={onPush}
							onPull={onPull}
							onFetch={onFetch}
						/>
					</Flex>
				)}
			</Box>
		</Dialog>
	);
};

export default SourceControlDialog;
