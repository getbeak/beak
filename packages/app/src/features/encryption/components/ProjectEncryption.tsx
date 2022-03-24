import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ipcEncryptionService } from '@beak/app/lib/ipc';

import { hideEncryptionView } from '../store/actions';
import FixProjectEncryption from './FixProjectEncryption';
import ViewProjectEncryption from './ViewProjectEncryption';

type Status = 'has_key' | 'needs_key' | 'pending';

const ProjectEncryption: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const open = useSelector(s => s.features.encryption.open);
	const [status, setStatus] = useState<Status>('pending');

	useEffect(() => {
		ipcEncryptionService.checkStatus()
			.then(check => setStatus(check ? 'has_key' : 'needs_key'));
	}, [open]);

	function close() {
		setStatus('pending');
		dispatch(hideEncryptionView());
	}

	if (!open)
		return null;

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
