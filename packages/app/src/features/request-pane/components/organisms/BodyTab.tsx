import { requestBodyJsonChanged, requestBodyTextChanged } from '@beak/app/store/project/actions';
import BasicTableView from '@beak/app/components/molecules/BasicTableView';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import RequestPreferencesContext from '../../contexts/request-preferences-context';
import BeakHubContext from '@beak/app/contexts/beak-hub-context';
import MonacoEditor from 'react-monaco-editor';

const { ipcRenderer } = window.require('electron');

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

		const response: number = await ipcRenderer.invoke('dialog:confirm_body_tab_change');

		if (response !== 0)
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
					{'JSON'}
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
							options={{
								automaticLayout: true,
								minimap: { enabled: false },
								fontFamily: "'Fira Code', Source Code Pro, Menlo, Monaco, 'Courier New', monospace",
								fontSize: 13,
							}}
						/>
					</React.Fragment>
				)}
				{tab === 'json' && (
					<React.Fragment>
						<MonacoEditor
							height={'100%'}
							width={'100%'}
							language={'json'}
							theme={'vs-dark'}
							value={node.info.body.payload as string}
							options={{
								automaticLayout: true,
								minimap: { enabled: false },
								fontFamily: "'Fira Code', Source Code Pro, Menlo, Monaco, 'Courier New', monospace",
								fontSize: 13,
							}}
						/>
					</React.Fragment>
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
