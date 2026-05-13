import type { RequestPreferenceMainTab } from '@beak/common/types/beak-hub';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import { requestPreferenceSetReqMainTab } from '@beak/ui/store/preferences/actions';
import actions from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import BodyTab from './BodyTab';
import OptionsView from './OptionsView';

export interface ModifiersProps {
	node: ValidRequestNode;
}

const Modifiers: React.FC<React.PropsWithChildren<ModifiersProps>> = props => {
	const dispatch = useDispatch();
	const { node } = props;
	const preferences = useAppSelector(s => s.global.preferences.requests[node.id])!;
	const tab = preferences.request.mainTab;

	function setTab(tab: RequestPreferenceMainTab) {
		dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab }));
	}

	return (
		<Flex direction='column' overflow='hidden' h='100%'>
			<TabBar $centered>
				<TabSpacer />
				<TabItem active={tab === 'headers'} onClick={() => setTab('headers')}>
					{'Headers'}
				</TabItem>
				<TabItem active={tab === 'url_query'} onClick={() => setTab('url_query')}>
					{'URL query'}
				</TabItem>
				<TabItem active={tab === 'body'} onClick={() => setTab('body')}>
					{'Body'}
				</TabItem>
				<TabItem active={tab === 'options'} onClick={() => setTab('options')}>
					{'Options'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<Box flexGrow={2} overflowY='auto' h='100%'>
				{tab === 'headers' && (
					<BasicTableEditor
						items={node.info.headers}
						requestId={node.id}
						addItem={() => dispatch(actions.requestHeaderAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestHeaderRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(type, id, value) =>
							dispatch(
								actions.requestHeaderUpdated({
									requestId: node.id,
									identifier: id,
									[type]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'url_query' && (
					<BasicTableEditor
						items={node.info.query}
						requestId={node.id}
						addItem={() => dispatch(actions.requestQueryAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestQueryRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(type, id, value) =>
							dispatch(
								actions.requestQueryUpdated({
									requestId: node.id,
									identifier: id,
									[type]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'body' && <BodyTab node={node} />}
				{tab === 'options' && <OptionsView node={node} />}
			</Box>
		</Flex>
	);
};

export default Modifiers;
