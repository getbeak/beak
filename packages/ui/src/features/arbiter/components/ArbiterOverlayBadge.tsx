import React, { useState } from 'react';
import styled from 'styled-components';

import useArbiterLocking from '../hooks/use-arbiter-locking';
import WarningLabel from './atoms/WarningLabel';
import ArbiterDialog from './organisms/ArbiterDialog';

const ArbiterOverlayBadge: React.FC = () => {
	const { showWarning } = useArbiterLocking();
	const [show, setShow] = useState(false);

	if (!showWarning)
		return null;

	return (
		<React.Fragment>
			<WarningBanner onClick={() => setShow(true)}>{'Subscription issue'}</WarningBanner>
			<ArbiterDialog open={show} onClose={() => setShow(false)} />
		</React.Fragment>
	);
};

const WarningBanner = styled(WarningLabel)`
	position: absolute;
	top: 20px; right: 20px;
`;

export default ArbiterOverlayBadge;
