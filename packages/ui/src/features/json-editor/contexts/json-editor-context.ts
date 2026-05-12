import type { ApplicationState } from '@beak/ui/store';
import { actions } from '@beak/ui/store/project';
import type {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/ui/store/project/types';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { AnyAction } from '@reduxjs/toolkit';
import { createContext } from 'react';

interface Context {
	requestId: string;
	editorSelector: (state: ApplicationState) => EntryMap;

	nameChange: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	valueChange: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	typeChange: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	enabledChange: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	addEntry: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	removeEntry: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
}

export const JsonEditorContext = createContext<Context>({
	requestId: 'impossible',
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
	addEntry: actions.requestBodyJsonEditorAddEntry,
	removeEntry: actions.requestBodyJsonEditorRemoveEntry,
});
