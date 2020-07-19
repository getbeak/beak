import React, { useState } from 'react';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

type Tab = 'debugging' | 'headers' | 'url_query' | 'body' | 'options';

const ModifiersPane: React.FunctionComponent = () => {
	const [tab, setTab] = useState<Tab>('debugging');

	return (
		<React.Fragment>
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
		</React.Fragment>
	);
};

export default ModifiersPane;
