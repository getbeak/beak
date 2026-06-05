import type { ApplicationState } from '@beak/ui/store';
import { actions } from '@beak/ui/store/project';
import type {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorDescriptionChangePayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorMoveEntryPayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorOptionsChangePayload,
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
	/**
	 * When true, the editor locks the schema — key cells are static text, the
	 * type chip can't be re-picked, drag handles + add/remove actions are
	 * hidden, and the "Paste schema" button is gone. Value cells and the
	 * per-row enabled toggle stay live. Used by the workflow request-node
	 * override panel, where the schema belongs to the linked request and the
	 * workflow step only edits values.
	 */
	valuesOnly: boolean;

	nameChange: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	valueChange: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	typeChange: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	enabledChange: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	descriptionChange: (payload: RequestBodyJsonEditorDescriptionChangePayload) => AnyAction;
	requiredChange: (payload: RequestBodyJsonEditorRequiredChangePayload) => AnyAction;
	optionsChange: (payload: RequestBodyJsonEditorOptionsChangePayload) => AnyAction;
	addEntry: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	removeEntry: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
	moveEntry: (payload: RequestBodyJsonEditorMoveEntryPayload) => AnyAction;
}

export const JsonEditorContext = createContext<Context>({
	requestId: 'impossible',
	schemaMode: false,
	valuesOnly: false,
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
	optionsChange: actions.requestBodyJsonEditorOptionsChange,
	addEntry: actions.requestBodyJsonEditorAddEntry,
	removeEntry: actions.requestBodyJsonEditorRemoveEntry,
	moveEntry: actions.requestBodyJsonEditorMoveEntry,
});
