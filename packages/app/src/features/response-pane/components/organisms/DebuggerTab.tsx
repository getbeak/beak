import React from 'react';
import styled from 'styled-components';

import { Flight } from '../../../../store/flight/types';

export interface DebuggerTabProps {
	flight: Flight;
}

const DebuggerTab: React.FunctionComponent<DebuggerTabProps> = props => (
	<React.Fragment>
		<SexiPre>
			{JSON.stringify({ ...props.flight }, null, '  ')}
		</SexiPre>
	</React.Fragment>
);

const SexiPre = styled.pre`
	font-size: 13px;
	font-family: monospace;
`;

export default DebuggerTab;
