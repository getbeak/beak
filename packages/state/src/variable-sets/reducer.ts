import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from './actions';
import type { VariableSetsState } from './types';
import {
	reduceDuplicateGroup,
	reduceDuplicateItem,
	reduceInsertNewGroup,
	reduceInsertNewItem,
	reduceInsertNewVariableSet,
	reduceMoveGroup,
	reduceMoveItem,
	reduceRemoveGroup,
	reduceRemoveItem,
	reduceRemoveVariableSetFromStore,
	reduceStartVariableSets,
	reduceUpdateGroupName,
	reduceUpdateItemName,
	reduceUpdateValue,
	reduceVariableSetsOpened,
} from './variable-sets-slice';

/**
 * Compatibility shim: attaches the pure variable-sets reducer cases to the
 * given builder so that the UI package can compose the domain reducer into its
 * wider state shape (which also carries rename + file-watch fields).
 *
 * The canonical implementation lives in `variable-sets-slice.ts`
 * (ADR 0005 migration). This function delegates each case to the shared
 * per-case reducer functions exported from that module.
 *
 * @deprecated Prefer importing `variableSetsSlice` directly when the UI store
 * is updated to use createSlice end-to-end.
 */
export function buildVariableSetsReducer<S extends VariableSetsState>(builder: ActionReducerMapBuilder<S>) {
	builder
		.addCase(actions.startVariableSets, reduceStartVariableSets)
		.addCase(actions.variableSetsOpened, reduceVariableSetsOpened)
		.addCase(actions.insertNewVariableSet, reduceInsertNewVariableSet)
		.addCase(actions.insertNewGroup, reduceInsertNewGroup)
		.addCase(actions.insertNewItem, reduceInsertNewItem)
		.addCase(actions.updateGroupName, reduceUpdateGroupName)
		.addCase(actions.updateItemName, reduceUpdateItemName)
		.addCase(actions.updateValue, reduceUpdateValue)
		.addCase(actions.removeVariableSetFromStore, reduceRemoveVariableSetFromStore)
		.addCase(actions.removeGroup, reduceRemoveGroup)
		.addCase(actions.removeItem, reduceRemoveItem)
		.addCase(actions.duplicateItem, reduceDuplicateItem)
		.addCase(actions.duplicateGroup, reduceDuplicateGroup)
		.addCase(actions.moveItem, reduceMoveItem)
		.addCase(actions.moveGroup, reduceMoveGroup);
}
