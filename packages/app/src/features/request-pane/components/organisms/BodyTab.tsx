import React from 'react';
import { useDispatch } from 'react-redux';
import EditorView from '@beak/app/components/atoms/EditorView';
import BasicTableEditor from '@beak/app/features/basic-table-editor/components/BasicTableEditor';
import { convertKeyValueToString, convertStringToKeyValue } from '@beak/app/features/basic-table-editor/parsers';
import JsonEditor from '@beak/app/features/json-editor/components/JsonEditor';
import { convertToEntryJson, convertToRealJson } from '@beak/app/features/json-editor/parsers';
import useRealtimeValueContext from '@beak/app/features/realtime-values/hooks/use-realtime-value-context';
import { ValueParts } from '@beak/app/features/realtime-values/values';
import { ipcDialogService } from '@beak/app/lib/ipc';
import actions, { requestBodyTextChanged } from '@beak/app/store/project/actions';
import { RequestBodyTypeChangedPayload } from '@beak/app/store/project/types';
import { attemptTextToJson } from '@beak/app/utils/json';
import ksuid from '@beak/ksuid';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyType } from '@getbeak/types/request';
import styled from 'styled-components';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

export interface BodyTabProps {
	node: ValidRequestNode;
}

const BodyTab: React.FC<React.PropsWithChildren<BodyTabProps>> = props => {
	const dispatch = useDispatch();
	const context = useRealtimeValueContext();
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
				const normalised = JSON.stringify(await convertToRealJson(context, body.payload), null, '\t');

				dispatch(actions.requestBodyTypeChanged({
					requestId: node.id,
					type: 'text',
					payload: normalised === '""' ? '' : normalised,
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

			<TabBody $allowVerticalScroll={body.type !== 'text'}>
				{body.type === 'text' && (
					<EditorView
						language={'text'}
						value={body.payload}
						onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text: text ?? '' }))}
					/>
				)}
				{body.type === 'json' && <JsonEditor requestId={node.id} value={body.payload} />}
				{body.type === 'url_encoded_form' && (
					<BasicTableEditor
						items={body.payload}
						requestId={node.id}
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

const TabBody = styled.div<{ $allowVerticalScroll: boolean }>`
	flex-grow: 2;

	overflow-y: ${p => p.$allowVerticalScroll ? 'auto' : 'hidden'};
	height: 100%;
`;

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
