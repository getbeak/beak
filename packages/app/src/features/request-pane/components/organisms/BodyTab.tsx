import BasicTableEditor from '@beak/app/features/basic-table-editor/components/BasicTableEditor';
import { convertKeyValueToString, convertStringToKeyValue } from '@beak/app/features/basic-table-editor/parsers';
import JsonEditor from '@beak/app/features/json-editor/components/JsonEditor';
import { convertToEntryJson, convertToRealJson } from '@beak/app/features/json-editor/parsers';
import { ipcDialogService } from '@beak/app/lib/ipc';
import actions, { requestBodyTextChanged } from '@beak/app/store/project/actions';
import { RequestBodyTypeChangedPayload } from '@beak/app/store/project/types';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import { RequestBodyType, RequestNode, ValueParts } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

export interface BodyTabProps {
	node: RequestNode;
}

const BodyTab: React.FunctionComponent<BodyTabProps> = props => {
	const dispatch = useDispatch();
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const projectPath = useSelector(s => s.global.project.projectPath!);
	const context = { projectPath, selectedGroups, variableGroups };
	const { node } = props;
	const { body } = node.info;

	async function changeRequestBodyType(newType: RequestBodyType) {
		if (newType === body.type)
			return;

		if (body.type !== 'text') {
			const result = await ipcDialogService.showMessageBox({
				title: 'Are you sure?',
				message: 'Are you sure you want to change body type?',
				detail: newType === 'text' ? 'Changing to text could cause data loss from disabled values!' : 'Changing editor will cause your existing body to be lost.',
				type: 'warning',
				buttons: ['Change', 'Cancel'],
				defaultId: 1,
				cancelId: 1,
			});

			if (result.response === 1)
				return;
		}

		// TODO(afr): Abstract this out somewhere more fitting

		// Changing from text to lang specific editor
		if (body.type === 'text') {
			if (newType === 'json') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'json',
					payload: convertToEntryJson(attemptTextToJson(body.payload)),
				}));

				return;
			} else if (newType === 'url_encoded_form') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'url_encoded_form',
					payload: convertStringToKeyValue(body.payload, 'urlencodeditem'),
				}));

				return;
			}
		}

		// Changing from lang specific editor to text
		if (newType === 'text') {
			if (body.type === 'json') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: JSON.stringify(await convertToRealJson(context, body.payload), null, '\t'),
				}));

				return;
			} else if (body.type === 'url_encoded_form') {
				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: await convertKeyValueToString(context, body.payload),
				}));

				return;
			}
		}

		// Catch all cross-fancy editor switching and just reset
		dispatch(actions.requestBodyTypeChanged(createEmptyBodyPayload(node.id, newType)));
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
					<MonacoEditor
						height={'100%'}
						width={'100%'}
						language={'plaintext'}
						theme={'vs-dark'}
						value={body.payload}
						options={createDefaultOptions()}
						onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text }))}
					/>
				)}
				{body.type === 'json' && <JsonEditor requestId={node.id} value={body.payload} />}
				{body.type === 'url_encoded_form' && (
					<BasicTableEditor
						items={body.payload}
						addItem={() => dispatch(actions.requestBodyUrlEncodedEditorAddItem({ requestId: node.id }))}
						removeItem={id => dispatch(actions.requestBodyUrlEncodedEditorRemoveItem({
							requestId: node.id,
							id,
						}))}
						updateItem={(type, id, value) => {
							if (type === 'name') {
								dispatch(actions.requestBodyUrlEncodedEditorNameChange({
									requestId: node.id,
									id,
									name: value as string,
								}));
							} else if (type === 'enabled') {
								dispatch(actions.requestBodyUrlEncodedEditorEnabledChange({
									requestId: node.id,
									id,
									enabled: value as boolean,
								}));
							} else if (type === 'value') {
								dispatch(actions.requestBodyUrlEncodedEditorValueChange({
									requestId: node.id,
									id,
									value: value as ValueParts,
								}));
							}
						}}
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

function attemptTextToJson(input: string) {
	try {
		return JSON.parse(input);
	} catch {
		return JSON.stringify(input);
	}
}

function createEmptyBodyPayload(requestId: string, type: RequestBodyType): RequestBodyTypeChangedPayload {
	switch (type) {
		case 'url_encoded_form':
			return { requestId, type, payload: {} };

		case 'json': {
			const id = ksuid.generate('jsonentry').toString() as string;

			return {
				requestId,
				type,
				payload: {
					[id]: {
						id,
						parentId: null,
						type: 'object',
						enabled: true,
					},
				},
			};
		}

		case 'text':
		default:
			return { requestId, type, payload: '' };
	}
}

export default BodyTab;
