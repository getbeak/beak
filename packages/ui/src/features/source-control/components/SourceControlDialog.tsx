import {
	operationDismissed,
	requestCheckout,
	requestCommit,
	requestCreateBranch,
	requestFetch,
	requestInit,
	requestPull,
	requestPush,
	requestStatus,
} from '@beak/state/git';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { GitCommitVertical } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '../../../components/molecules/Dialog';
import { useGitAuthor } from '../hooks/use-git-author';
import { closeSourceControl } from '../store';
import AuthorFields from './molecules/AuthorFields';
import BranchSwitcher from './molecules/BranchSwitcher';
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
		!pending && message.trim().length > 0 && author.name.trim().length > 0 && author.email.trim().length > 0 && dirty;

	useEffect(() => {
		if (!open) return;
		if (!git.available) return;
		dispatch(requestStatus());
	}, [open, git.available, dispatch]);

	useEffect(() => {
		if (git.operation.phase === 'success' && git.operation.op === 'commit') setMessage('');
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

	function onInit() {
		dispatch(operationDismissed());
		dispatch(requestInit({}));
	}

	if (!open) return null;

	const fileCount = git.status?.files.length ?? 0;
	const commitLabel = `Commit ${fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : ''}`.trim();

	return (
		<Dialog onClose={onClose} size='lg' tone='indigo'>
			<Box minW='600px' maxW='680px'>
				<DialogHeader
					icon={<GitCommitVertical size={14} strokeWidth={2.2} />}
					title='Source control'
					description='Commit, push, pull — everything happens against the project root.'
				/>

				{!git.available ? (
					<React.Fragment>
						<DialogBody>
							<Flex direction='column' gap='3'>
								<Box
									p='4'
									borderWidth='1px'
									borderStyle='dashed'
									borderColor='border.subtle'
									borderRadius='md'
									bg='bg.canvas'
									color='fg.muted'
									fontSize='sm'
								>
									{
										'This project isn’t a git repo yet. Initialise one here to start tracking changes, or clone an existing repo from the welcome screen.'
									}
								</Box>
								<OperationStatus state={git.operation} />
							</Flex>
						</DialogBody>
						<DialogFooter>
							<Button size='sm' colour='secondary' onClick={onClose} disabled={pending}>
								{'Close'}
							</Button>
							<Button size='sm' onClick={onInit} disabled={pending}>
								{'Initialise repository'}
							</Button>
						</DialogFooter>
					</React.Fragment>
				) : (
					<React.Fragment>
						<DialogBody>
							<Flex direction='column' gap='4'>
								<Flex align='center' justify='space-between' wrap='wrap' gap='3'>
									<BranchSwitcher
										branch={git.selectedBranch}
										branches={git.branches.map(b => b.name)}
										dirty={dirty}
										disabled={pending}
										onSwitch={ref => {
											dispatch(operationDismissed());
											dispatch(requestCheckout({ ref }));
										}}
										onCreate={(ref, opts) => {
											dispatch(operationDismissed());
											dispatch(requestCreateBranch({ ref, checkout: opts.checkout }));
										}}
									/>
									<Flex
										px='2.5'
										py='1'
										borderRadius='full'
										borderWidth='1px'
										borderColor='border.subtle'
										bg='bg.canvas'
										gap='2.5'
										fontSize='10px'
										fontWeight='700'
										letterSpacing='0.04em'
										textTransform='uppercase'
										color='fg.muted'
									>
										<Box>{`${git.status?.staged ?? 0} staged`}</Box>
										<Box>{`${git.status?.unstaged ?? 0} unstaged`}</Box>
										<Box>{`${git.status?.untracked ?? 0} new`}</Box>
									</Flex>
								</Flex>

								<FileChangesList files={git.status?.files ?? []} loading={git.statusLoading} />

								<OperationStatus state={git.operation} />

								<Flex direction='column' gap='1'>
									<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
										{'Commit message'}
									</Box>
									<Input
										$beakSize='md'
										value={message}
										placeholder='Describe the change'
										onChange={e => setMessage(e.currentTarget.value)}
										disabled={pending}
									/>
								</Flex>

								<AuthorFields author={author} onChange={setAuthor} disabled={pending} />

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
						</DialogBody>
						<DialogFooter>
							<Button size='sm' colour='secondary' onClick={onClose} disabled={pending}>
								{'Close'}
							</Button>
							<Button size='sm' onClick={onCommit} disabled={!canCommit}>
								{commitLabel}
							</Button>
						</DialogFooter>
					</React.Fragment>
				)}
			</Box>
		</Dialog>
	);
};

export default SourceControlDialog;
