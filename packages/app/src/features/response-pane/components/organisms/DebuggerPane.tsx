import React from 'react';
import styled from 'styled-components';

import { Flight } from '../../../../store/flight/types';

export interface DebuggerPaneProps {
	flight: Flight;
}

const DebuggerPane: React.FunctionComponent<DebuggerPaneProps> = props => (
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

export default DebuggerPane;
