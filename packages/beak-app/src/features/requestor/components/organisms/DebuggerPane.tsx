import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';

export interface DebuggerPaneProps {
	node: RequestNode;
}

const DebuggerPane: React.FunctionComponent<DebuggerPaneProps> = props => (
	<React.Fragment>
		<SexiPre>
			{JSON.stringify({ ...props.node, parent: '[omitted]' }, null, '  ')}
		</SexiPre>
	</React.Fragment>
);

const SexiPre = styled.pre`
	font-size: 13px;
	font-family: monospace;
`;

export default DebuggerPane;
