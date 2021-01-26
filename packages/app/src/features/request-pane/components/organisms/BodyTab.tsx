import BasicTableView from '@beak/app/components/molecules/BasicTableView';
import BeakHubContext from '@beak/app/contexts/beak-hub-context';
import JsonEditor from '@beak/app/features/json-editor/components/JsonEditor';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { requestBodyTextChanged } from '@beak/app/store/project/actions';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { Entries } from '@beak/common/types/beak-json-editor';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useContext, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import RequestPreferencesContext from '../../contexts/request-preferences-context';

type Tab = 'text' | 'json' | 'url-encoded-form';

export interface BodyTabProps {
	node: RequestNode;
}

const BodyTab: React.FunctionComponent<BodyTabProps> = props => {
	const dispatch = useDispatch();
	const preferences = useContext(RequestPreferencesContext)!;
	const { node } = props;
	const hub = useContext(BeakHubContext);
	const [tab, setTab] = useState<Tab>(preferences.subTab as Tab || 'text');

	async function setTabWithConfirmation(newTab: Tab) {
		if (newTab === tab)
			return;

		const result = await ipcDialogService.showMessageBox({
			message: 'Are you sure you want to change body type? Doing so will cause any data in the current body to be wiped!',
			type: 'warning',
			buttons: ['Change', 'Cancel'],
			defaultId: 1,
		});

		if (result.response !== 0)
			return;

		hub!.setRequestPreferences(node.id, { mainTab: 'body', subTab: tab });
		setTab(newTab);
	}

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={tab === 'text'}
					size={'sm'}
					onClick={() => setTabWithConfirmation('text')}
				>
					{'Text'}
				</TabItem>
				<TabItem
					active={tab === 'json'}
					size={'sm'}
					onClick={() => setTabWithConfirmation('json')}
				>
					{'Json'}
				</TabItem>
				<TabItem
					active={tab === 'url-encoded-form'}
					size={'sm'}
					onClick={() => setTabWithConfirmation('url-encoded-form')}
				>
					{'URL-encoded form'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{tab === 'text' && (
					<React.Fragment>
						<MonacoEditor
							height={'100%'}
							width={'100%'}
							language={'plaintext'}
							theme={'vs-dark'}
							value={node.info.body.payload as string}
							options={createDefaultOptions()}
							onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text }))}
						/>
					</React.Fragment>
				)}
				{tab === 'json' && (
					<JsonEditor value={node.info.body.payload as Entries} />
				)}
				{tab === 'url-encoded-form' && (
					<BasicTableView
						editable={false}
						items={{}}
					/>
				)}
			</TabBody>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 100%;
`;

const TabBody = styled.div`
	flex-grow: 2;

	overflow-y: hidden;
	height: 100%;
`;

export default BodyTab;
