import type { ApplicationState } from '@beak/ui/store';
import { actions } from '@beak/ui/store/project';
import type {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorDescriptionChangePayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorMoveEntryPayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorRequiredChangePayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/ui/store/project/types';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { AnyAction } from '@reduxjs/toolkit';
import { createContext } from 'react';

interface Context {
	requestId: string;
	editorSelector: (state: ApplicationState) => EntryMap;
	/** When true, value cells are hidden in favour of schema-authoring affordances. */
	schemaMode: boolean;

	nameChange: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	valueChange: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	typeChange: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	enabledChange: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	descriptionChange: (payload: RequestBodyJsonEditorDescriptionChangePayload) => AnyAction;
	requiredChange: (payload: RequestBodyJsonEditorRequiredChangePayload) => AnyAction;
	addEntry: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	removeEntry: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
	moveEntry: (payload: RequestBodyJsonEditorMoveEntryPayload) => AnyAction;
}

export const JsonEditorContext = createContext<Context>({
	requestId: 'impossible',
	schemaMode: false,
	editorSelector: () => ({
		'no-op': {
			enabled: true,
			id: 'no-op',
			name: 'No-operation',
			parentId: null,
			type: 'string',
			value: ['No-operation'],
		},
	}),

	nameChange: actions.requestBodyJsonEditorNameChange,
	valueChange: actions.requestBodyJsonEditorValueChange,
	typeChange: actions.requestBodyJsonEditorTypeChange,
	enabledChange: actions.requestBodyJsonEditorEnabledChange,
	descriptionChange: actions.requestBodyJsonEditorDescriptionChange,
	requiredChange: actions.requestBodyJsonEditorRequiredChange,
	addEntry: actions.requestBodyJsonEditorAddEntry,
	removeEntry: actions.requestBodyJsonEditorRemoveEntry,
	moveEntry: actions.requestBodyJsonEditorMoveEntry,
});
