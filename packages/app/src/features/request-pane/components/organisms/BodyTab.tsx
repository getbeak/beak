import BasicTableView from '@beak/app/components/molecules/BasicTableView';
import JsonEditor from '@beak/app/features/json-editor/components/JsonEditor';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { requestBodyTextChanged } from '@beak/app/store/project/actions';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { RequestPreferenceBodySubTab } from '@beak/common/types/beak-hub';
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

export interface BodyTabProps {
	node: RequestNode;
}

const BodyTab: React.FunctionComponent<BodyTabProps> = props => {
	const dispatch = useDispatch();
	const reqPref = useContext(RequestPreferencesContext)!;
	const { node } = props;
	const [tab, setTab] = useState<RequestPreferenceBodySubTab>(reqPref.getPreferences().bodySubTab);

	async function setTabWithConfirmation(newTab: RequestPreferenceBodySubTab) {
		if (newTab === tab)
			return;

		const result = await ipcDialogService.showMessageBox({
			title: 'Are you sure?',
			message: 'Are you sure you want to change body type?',
			detail: 'Changing the body type could cause data to be lost!',
			type: 'warning',
			buttons: ['Change', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});

		if (result.response === 1)
			return;

		reqPref.setBodySubTab(tab);
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
					active={tab === 'url_encoded_form'}
					size={'sm'}
					onClick={() => setTabWithConfirmation('url_encoded_form')}
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
					<JsonEditor
						requestId={node.id}
						value={node.info.body.payload as Entries}
					/>
				)}
				{tab === 'url_encoded_form' && (
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
