import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { hideEncryptionView } from '../store/actions';
import FixProjectEncryption from './FixProjectEncryption';
import ViewProjectEncryption from './ViewProjectEncryption';

type Status = 'has_key' | 'needs_key' | 'pending';

const ProjectEncryption: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const open = useAppSelector(s => s.features.encryption.open);
	const [status, setStatus] = useState<Status>('pending');

	useEffect(() => {
		let cancelled = false;
		ipcEncryptionService.checkStatus().then(check => {
			if (!cancelled) setStatus(check ? 'has_key' : 'needs_key');
		});
		return () => {
			cancelled = true;
		};
	}, [open]);

	function close() {
		setStatus('pending');
		dispatch(hideEncryptionView());
	}

	if (!open) return null;

	switch (status) {
		case 'has_key':
			return <ViewProjectEncryption onClose={close} />;

		case 'needs_key':
			return <FixProjectEncryption onClose={close} />;

		default:
			return null;
	}
};

export default ProjectEncryption;
