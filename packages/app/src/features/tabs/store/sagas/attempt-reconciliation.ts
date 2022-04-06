import { ApplicationState } from '@beak/app/store';
import { createTakeEverySagaSet } from '@beak/app/utils/redux/sagas';
import { TypedObject } from '@beak/common/helpers/typescript';
import { TabItem, Tree, VariableGroups } from '@beak/common/types/beak-project';
import { put, select } from 'redux-saga/effects';

import actions, { closeTab, reconciliationComplete } from '../actions';

export default createTakeEverySagaSet(actions.attemptReconciliation, function* worker() {
	const tabs: TabItem[] = yield select((s: ApplicationState) => s.features.tabs.activeTabs);
	const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);
	const variableGroups: VariableGroups = yield select(
		(s: ApplicationState) => s.global.variableGroups.variableGroups,
	);

	const nodes = TypedObject.values(tree);
	const variableGroupNames = TypedObject.keys(variableGroups);

	for (const tab of tabs) {
		switch (tab.type) {
			case 'request': {
				const node = nodes.find(n => n.id === tab.payload);

				if (!node)
					yield put(closeTab(tab.payload));
				break;
			}

			case 'variable_group_editor': {
				const variableGroup = variableGroupNames.find(n => n === tab.payload);

				if (!variableGroup)
					yield put(closeTab(tab.payload));
				break;
			}

			default:
				// @ts-expect-error
				yield put(closeTab(tab.payload));
		}
	}

	yield put(reconciliationComplete());
});
