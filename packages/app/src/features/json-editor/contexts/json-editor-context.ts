import { createContext } from 'react';
import { actions } from '@beak/app/store/project';
import {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/app/store/project/types';
import { AnyAction } from '@reduxjs/toolkit';

interface Context {
	requestBodyJsonEditorNameChange: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	requestBodyJsonEditorValueChange: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	requestBodyJsonEditorTypeChange: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	requestBodyJsonEditorEnabledChange: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	requestBodyJsonEditorAddEntry: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	requestBodyJsonEditorRemoveEntry: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
}

export const JsonEditorAbstractionsContext = createContext<Context>({
	requestBodyJsonEditorNameChange: actions.requestBodyJsonEditorNameChange,
	requestBodyJsonEditorValueChange: actions.requestBodyJsonEditorValueChange,
	requestBodyJsonEditorTypeChange: actions.requestBodyJsonEditorTypeChange,
	requestBodyJsonEditorEnabledChange: actions.requestBodyJsonEditorEnabledChange,
	requestBodyJsonEditorAddEntry: actions.requestBodyJsonEditorAddEntry,
	requestBodyJsonEditorRemoveEntry: actions.requestBodyJsonEditorRemoveEntry,
});
