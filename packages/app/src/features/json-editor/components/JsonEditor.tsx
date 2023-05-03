import React from 'react';
import { actions } from '@beak/app/store/project';
import {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/app/store/project/types';
import { TypedObject } from '@beak/common/helpers/typescript';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import { AnyAction } from '@reduxjs/toolkit';
import styled from 'styled-components';

import { JsonEditorAbstractionsContext } from '../contexts/json-editor-context';
import {
	HeaderAction,
	HeaderKeyCell,
	HeaderTypeCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import { JsonEntry } from './molecules/JsonEntry';

interface JsonEditorProps {
	requestId: string;
	value: EntryMap;

	jsonEditorNameChanged?: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	jsonEditorValueChanged?: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	jsonEditorTypeChanged?: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	jsonEditorEnabledChanged?: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	jsonEditorAddedEntry?: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	jsonEditorRemovedEntry?: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
}

const JsonEditor: React.FC<React.PropsWithChildren<JsonEditorProps>> = props => {
	const { requestId, value } = props;
	const root = TypedObject.values(value).find(e => e.parentId === null);

	return (
		<JsonEditorAbstractionsContext.Provider value={{
			requestBodyJsonEditorNameChange: props.jsonEditorNameChanged ?? actions.requestBodyJsonEditorNameChange,
			requestBodyJsonEditorValueChange: props.jsonEditorValueChanged ?? actions.requestBodyJsonEditorValueChange,
			requestBodyJsonEditorTypeChange: props.jsonEditorTypeChanged ?? actions.requestBodyJsonEditorTypeChange,

			// eslint-disable-next-line max-len
			requestBodyJsonEditorEnabledChange: props.jsonEditorEnabledChanged ?? actions.requestBodyJsonEditorEnabledChange,

			requestBodyJsonEditorAddEntry: props.jsonEditorAddedEntry ?? actions.requestBodyJsonEditorAddEntry,
			requestBodyJsonEditorRemoveEntry: props.jsonEditorRemovedEntry ?? actions.requestBodyJsonEditorRemoveEntry,
		}}>
			<Wrapper>
				<Header>
					<Row>
						<HeaderKeyCell>{'Key'}</HeaderKeyCell>
						<HeaderTypeCell>{'Type'}</HeaderTypeCell>
						<HeaderValueCell>{'Value'}</HeaderValueCell>
						<HeaderAction />
					</Row>
				</Header>
				<Body>
					<JsonEntry
						requestId={requestId}
						depth={0}
						value={root!}
					/>
				</Body>
			</Wrapper>
		</JsonEditorAbstractionsContext.Provider>
	);
};

export default JsonEditor;

const Wrapper = styled.div`
	margin-top: 5px;
	width: 100%;

	font-size: 12px;
	font-weight: 400;

	color: ${p => p.theme.ui.textMinor};
`;
