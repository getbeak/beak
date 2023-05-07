import React from 'react';
import { ApplicationState } from '@beak/app/store';
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

import { JsonEditorContext } from '../contexts/json-editor-context';
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
	editorSelector: (state: ApplicationState) => EntryMap;
	value: EntryMap;

	forceRootObject?: boolean;

	nameChanged?: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	valueChanged?: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	typeChanged?: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	enabledChanged?: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	addedEntry?: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	removedEntry?: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
}

const JsonEditor: React.FC<React.PropsWithChildren<JsonEditorProps>> = props => {
	const { requestId, editorSelector, value, forceRootObject } = props;
	const root = TypedObject.values(value).find(e => e.parentId === null);

	// TODO(afr): If there is no root element, create one and return null

	return (
		<JsonEditorContext.Provider value={{
			requestId,
			editorSelector,

			nameChange: props.nameChanged ?? actions.requestBodyJsonEditorNameChange,
			valueChange: props.valueChanged ?? actions.requestBodyJsonEditorValueChange,
			typeChange: props.typeChanged ?? actions.requestBodyJsonEditorTypeChange,
			enabledChange: props.enabledChanged ?? actions.requestBodyJsonEditorEnabledChange,
			addEntry: props.addedEntry ?? actions.requestBodyJsonEditorAddEntry,
			removeEntry: props.removedEntry ?? actions.requestBodyJsonEditorRemoveEntry,
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
						forceRootObject={forceRootObject}
						requestId={requestId}
						depth={0}
						value={root!}
					/>
				</Body>
			</Wrapper>
		</JsonEditorContext.Provider>
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
