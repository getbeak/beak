import BasicTableView from '@beak/app/components/molecules/BasicTableView';
import JsonEditor from '@beak/app/features/json-editor/components/JsonEditor';
import { ipcDialogService } from '@beak/app/lib/ipc';
import actions, { requestBodyTextChanged } from '@beak/app/store/project/actions';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { RequestBodyType, RequestNode } from '@beak/common/types/beak-project';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

export interface BodyTabProps {
	node: RequestNode;
}

const BodyTab: React.FunctionComponent<BodyTabProps> = props => {
	const dispatch = useDispatch();
	const { node } = props;
	const { body } = node.info;

	async function changeRequestBodyType(newType: RequestBodyType) {
		if (newType === body.type)
			return;

		if (body.type !== 'text') {
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
		}

		dispatch(actions.requestBodyTypeChanged({ requestId: node.id, type: newType }));
	}

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem
					active={body.type === 'text'}
					size={'sm'}
					onClick={() => changeRequestBodyType('text')}
				>
					{'Text'}
				</TabItem>
				<TabItem
					active={body.type === 'json'}
					size={'sm'}
					onClick={() => changeRequestBodyType('json')}
				>
					{'Json'}
				</TabItem>
				<TabItem
					active={body.type === 'url_encoded_form'}
					size={'sm'}
					onClick={() => changeRequestBodyType('url_encoded_form')}
				>
					{'Url encoded form'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				{body.type === 'text' && (
					<React.Fragment>
						<MonacoEditor
							height={'100%'}
							width={'100%'}
							language={'plaintext'}
							theme={'vs-dark'}
							value={body.payload}
							options={createDefaultOptions()}
							onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text }))}
						/>
					</React.Fragment>
				)}
				{body.type === 'json' && <JsonEditor requestId={node.id} value={body.payload} />}
				{body.type === 'url_encoded_form' && (
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
