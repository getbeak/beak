import { TypedObject } from '@beak/common/helpers/typescript';
import type { ApplicationState } from '@beak/ui/store';
import { actions } from '@beak/ui/store/project';
import type {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorMoveEntryPayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/ui/store/project/types';
import { Box } from '@chakra-ui/react';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { AnyAction } from '@reduxjs/toolkit';
import * as React from 'react';

import { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { JsonEditorContext } from '../contexts/json-editor-context';
import {
	HeaderAction,
	HeaderDragCell,
	HeaderFolderCell,
	HeaderKeyCell,
	HeaderToggleCell,
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
	movedEntry?: (payload: RequestBodyJsonEditorMoveEntryPayload) => AnyAction;
}

const JsonEditor: React.FC<React.PropsWithChildren<JsonEditorProps>> = props => {
	const { requestId, editorSelector, value, forceRootObject } = props;
	const root = TypedObject.values(value).find(e => e.parentId === null);

	const ctxValue = useMemo(
		() => ({
			requestId,
			editorSelector,
			nameChange: props.nameChanged ?? actions.requestBodyJsonEditorNameChange,
			valueChange: props.valueChanged ?? actions.requestBodyJsonEditorValueChange,
			typeChange: props.typeChanged ?? actions.requestBodyJsonEditorTypeChange,
			enabledChange: props.enabledChanged ?? actions.requestBodyJsonEditorEnabledChange,
			addEntry: props.addedEntry ?? actions.requestBodyJsonEditorAddEntry,
			removeEntry: props.removedEntry ?? actions.requestBodyJsonEditorRemoveEntry,
			moveEntry: props.movedEntry ?? actions.requestBodyJsonEditorMoveEntry,
		}),
		[
			requestId,
			editorSelector,
			props.nameChanged,
			props.valueChanged,
			props.typeChanged,
			props.enabledChanged,
			props.addedEntry,
			props.removedEntry,
			props.movedEntry,
		],
	);

	return (
		<DndProvider backend={HTML5Backend}>
			<JsonEditorContext.Provider value={ctxValue}>
				<Box mt='1.5' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
					<Header>
						<Row data-empty='true'>
							<HeaderFolderCell />
							<HeaderToggleCell />
							<HeaderKeyCell>{'Key'}</HeaderKeyCell>
							<HeaderTypeCell>{'Type'}</HeaderTypeCell>
							<HeaderValueCell>{'Value'}</HeaderValueCell>
							<HeaderAction />
							<HeaderDragCell />
						</Row>
					</Header>
					<Body>
						<JsonEntry forceRootObject={forceRootObject} requestId={requestId} depth={0} value={root!} />
					</Body>
				</Box>
			</JsonEditorContext.Provider>
		</DndProvider>
	);
};

export default JsonEditor;
