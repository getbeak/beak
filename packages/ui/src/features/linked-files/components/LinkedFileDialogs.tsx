import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import * as projectActions from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import { Link2Off, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import { closeTab } from '../../tabs/store/actions';

/**
 * Two modal prompts that wrap the linked-file lifecycle:
 *
 *  - `<UnlinkConfirmDialog>` opens when the user tries to close a tab whose
 *    underlying request is `_provenance.linked: true` AND has unsaved
 *    in-memory edits. Offers "Rename + Unlink" (persist as a new file) or
 *    "Discard changes" (close + drop edits).
 *  - `<StaleReloadDialog>` opens on tab focus when an external write (e.g.
 *    a re-sync) clobbered the file under the user's tab. Offers "Reload"
 *    (accept disk version) or "Keep my version" (ignore disk change).
 *
 * Both dialogs read their open/closed state from `pendingUnlinkConfirm` /
 * `pendingStaleReload` on the project slice — fire-and-forget for callers.
 */
const LinkedFileDialogs: React.FC = () => (
	<React.Fragment>
		<UnlinkConfirmDialog />
		<StaleReloadDialog />
	</React.Fragment>
);

const UnlinkConfirmDialog: React.FC = () => {
	const dispatch = useDispatch();
	const pending = useAppSelector(s => s.global.project.pendingUnlinkConfirm);
	const node = useAppSelector(s => (pending ? s.global.project.tree[pending.requestId] : undefined));
	if (!pending) return null;

	const requestName = node?.type === 'request' ? node.name : 'this request';

	function onCancel() {
		dispatch(projectActions.unlinkConfirmDismiss());
	}

	function onDiscard() {
		if (!pending) return;
		// Drop in-memory edits and close the tab. The on-disk (spec) version
		// stays put, so reopening the tab picks up the clean state.
		dispatch(projectActions.relinkRequest({ requestId: pending.requestId }));
		dispatch(projectActions.unlinkConfirmDismiss());
		dispatch(closeTab(pending.requestId));
	}

	function onUnlinkRename() {
		if (!pending) return;
		dispatch(projectActions.unlinkAndRename({ requestId: pending.requestId }));
	}

	return (
		<Dialog onClose={onCancel} tone='alert'>
			<Box w='480px'>
				<DialogHeader
					icon={<Link2Off size={14} strokeWidth={2.2} />}
					title='Unlink before your changes can persist'
					description={`${requestName} is linked to a spec — re-syncs overwrite it.`}
				/>
				<DialogBody>
					<Box as='p' fontSize='sm' color='fg.default' lineHeight='1.55'>
						{'Closing this tab will discard your edits unless you unlink. '}
						{'Unlinking copies your changes into a new file (the original stays in place so the next re-sync repopulates it).'}
					</Box>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={onDiscard}>
						{'Discard changes'}
					</Button>
					<Button size='sm' onClick={onUnlinkRename}>
						{'Rename + Unlink'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

const StaleReloadDialog: React.FC = () => {
	const dispatch = useDispatch();
	const pending = useAppSelector(s => s.global.project.pendingStaleReload);
	const isDirty = useAppSelector(s =>
		pending ? Boolean(s.global.project.linkedDirty[pending.requestId]) : false,
	);
	const node = useAppSelector(s => (pending ? s.global.project.tree[pending.requestId] : undefined));
	if (!pending) return null;

	const requestName = node?.type === 'request' ? node.name : 'This request';

	function onReload() {
		if (!pending) return;
		dispatch(projectActions.reloadStaleRequest({ requestId: pending.requestId }));
	}

	function onKeep() {
		if (!pending) return;
		dispatch(projectActions.keepLocalStaleRequest({ requestId: pending.requestId }));
	}

	return (
		<Dialog onClose={onKeep} tone='indigo'>
			<Box w='480px'>
				<DialogHeader
					icon={<RefreshCw size={14} strokeWidth={2.2} />}
					title='The spec was re-synced'
					description={`${requestName} changed on disk while this tab was open.`}
				/>
				<DialogBody>
					<Box as='p' fontSize='sm' color='fg.default' lineHeight='1.55'>
						{isDirty
							? 'You have unsaved local edits. Reloading drops them in favour of the new spec output. Keep your version to ignore the disk change.'
							: 'Reload to pull in the latest spec output, or keep the version you were looking at.'}
					</Box>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={onKeep}>
						{'Keep my version'}
					</Button>
					<Button size='sm' onClick={onReload}>
						{'Reload'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

export default LinkedFileDialogs;
