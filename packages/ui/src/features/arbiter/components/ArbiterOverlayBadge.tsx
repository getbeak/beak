import * as React from 'react';
import { useState } from 'react';

import useArbiterLocking from '../hooks/use-arbiter-locking';
import WarningLabel from './atoms/WarningLabel';
import ArbiterDialog from './organisms/ArbiterDialog';

const ArbiterOverlayBadge: React.FC = () => {
	const { showWarning } = useArbiterLocking();
	const [show, setShow] = useState(false);

	if (!showWarning) return null;

	return (
		<React.Fragment>
			<div style={{ position: 'absolute', top: 20, right: 20, zIndex: 102 }}>
				<WarningLabel onClick={() => setShow(true)}>{'Subscription issue'}</WarningLabel>
			</div>
			<ArbiterDialog open={show} onClose={() => setShow(false)} />
		</React.Fragment>
	);
};

export default ArbiterOverlayBadge;
