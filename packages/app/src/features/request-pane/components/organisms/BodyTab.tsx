// eslint-disable-next-line simple-import-sort/sort
import { getProjectSingleton } from '@beak/app/lib/beak-project/instance';
import { requestBodyJsonChanged, requestBodyTextChanged } from '@beak/app/store/project/actions';
import BasicTableView from '@beak/app/components/molecules/BasicTableView';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useContext, useState } from 'react';
import AceEditor from 'react-ace';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';
import RequestPreferencesContext from '../../contexts/request-preferences-context';

import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-solarized_dark';

const { ipcRenderer } = window.require('electron');

type Tab = 'text' | 'json' | 'url-encoded-form';

export interface BodyTabProps {
	node: RequestNode;
}

const BodyTab: React.FunctionComponent<BodyTabProps> = props => {
	const dispatch = useDispatch();
	const preferences = useContext(RequestPreferencesContext)!;
	const { node } = props;
	const [tab, setTab] = useState<Tab>(preferences.subTab as Tab || 'text');

	async function setTabWithConfirmation(newTab: Tab) {
		if (newTab === tab)
			return;

		const response: number = await ipcRenderer.invoke('dialog:confirm_body_tab_change');

		if (response !== 0)
			return;

		setTab(newTab);

		getProjectSingleton().getHub()
			.setRequestPreferences(node.id, { mainTab: 'body', subTab: tab });
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
						<AceEditor
							mode={'text'}
							theme={'solarized_dark'}
							height={'100%'}
							width={'100%'}
							setOptions={{
								useWorker: false,
								fontFamily: 'monospace',
								fontSize: '13px',
							}}
							value={node.info.body.payload as string}
							onChange={e => dispatch(requestBodyTextChanged({ requestId: node.id, text: e }))}
							showPrintMargin={false}
						/>
					</React.Fragment>
				)}
				{tab === 'json' && (
					<React.Fragment>
						<AceEditor
							mode={'json'}
							theme={'solarized_dark'}
							height={'100%'}
							width={'100%'}
							setOptions={{
								useWorker: false,
								fontFamily: 'monospace',
								fontSize: '13px',
							}}
							value={node.info.body.payload as string}
							onChange={e => dispatch(requestBodyJsonChanged({ requestId: node.id, json: e }))}
							showPrintMargin={false}
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

	overflow-y: auto;
	height: 100%;
`;

export default BodyTab;
