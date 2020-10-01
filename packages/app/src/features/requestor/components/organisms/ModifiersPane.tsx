import { RequestNode } from '@beak/common/src/beak-project/types';
import React, { useState } from 'react';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import DebuggerPane from './DebuggerPane';
import UrlQueryPane from './UrlQueryPane';

type Tab = 'debugging' | 'headers' | 'url_query' | 'body' | 'options';

export interface ModifiersPaneProps {
	node: RequestNode;
}

const ModifiersPane: React.FunctionComponent<ModifiersPaneProps> = props => {
	const [tab, setTab] = useState<Tab>('url_query');

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'debugging'}
					onClick={() => setTab('debugging')}
				>
					{'Debugging'}
				</TabItem>
				<TabItem
					active={tab === 'headers'}
					onClick={() => setTab('headers')}
				>
					{'Headers'}
				</TabItem>
				<TabItem
					active={tab === 'url_query'}
					onClick={() => setTab('url_query')}
				>
					{'URL query'}
				</TabItem>
				<TabItem
					active={tab === 'body'}
					onClick={() => setTab('body')}
				>
					{'Body'}
				</TabItem>
				<TabItem
					active={tab === 'options'}
					onClick={() => setTab('options')}
				>
					{'Options'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'debugging' && <DebuggerPane node={props.node} />}
				{tab === 'url_query' && <UrlQueryPane node={props.node} />}
			</TabBody>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const TabBody = styled.div`
	flex-grow: 2;

	overflow-y: auto;
`;

export default ModifiersPane;
