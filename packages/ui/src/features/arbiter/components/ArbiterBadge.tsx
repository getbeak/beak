import React, { useState } from 'react';

import useArbiterLocking from '../hooks/use-arbiter-locking';
import WarningLabel from './atoms/WarningLabel';
import ArbiterDialog from './organisms/ArbiterDialog';

const ArbiterBadge: React.FC = () => {
	const { showWarning } = useArbiterLocking();
	const [show, setShow] = useState(false);

	if (!showWarning)
		return null;

	return (
		<React.Fragment>
			<WarningLabel onClick={() => setShow(true)}>{'Subscription issue'}</WarningLabel>
			<ArbiterDialog open={show} onClose={() => setShow(false)} />
		</React.Fragment>
	);
};

export default ArbiterBadge;
