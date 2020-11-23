import React, { useState } from 'react';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import { Flight } from '../../../../store/flight/types';
import RequestTab from './RequestTab';
import ResponseTab from './ResponseTab';

type Tab = 'request' | 'response';

export interface InspectorProps {
	flight: Flight;
}

const Inspector: React.FunctionComponent<InspectorProps> = props => {
	const [tab, setTab] = useState<Tab>('response');

	return (
		<React.Fragment>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'request'}
					onClick={() => setTab('request')}
				>
					{'Request'}
				</TabItem>
				<TabItem
					active={tab === 'response'}
					onClick={() => setTab('response')}
				>
					{'Response'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'request' && <RequestTab flight={props.flight} />}
				{tab === 'response' && <ResponseTab flight={props.flight} />}
			</TabBody>
		</React.Fragment>
	);
};

const TabBody = styled.div`
	flex-grow: 2;

	overflow-y: auto;
`;

export default Inspector;
