import { RequestNode } from '@beak/common/types/beak-project';
import React from 'react';
import styled from 'styled-components';

export interface DebuggerTabProps {
	node: RequestNode;
}

const DebuggerTab: React.FunctionComponent<DebuggerTabProps> = props => (
	<React.Fragment>
		<SexiPre>
			{JSON.stringify(props.node, null, '  ')}
		</SexiPre>
	</React.Fragment>
);

const SexiPre = styled.pre`
	font-size: 13px;
	font-family: monospace;

	padding: 0 15px;
`;

export default DebuggerTab;
