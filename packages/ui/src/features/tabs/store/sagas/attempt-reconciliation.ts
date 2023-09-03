import { ApplicationState } from '@beak/ui/store';
import { createTakeLatestSagaSet } from '@beak/ui/utils/redux/sagas';
import { TypedObject } from '@beak/common/helpers/typescript';
import { TabItem } from '@beak/common/types/beak-project';
import type { Tree } from '@getbeak/types/nodes';
import type { VariableGroups } from '@getbeak/types/variable-groups';
import { delay, put, select } from 'redux-saga/effects';

import actions, { closeTab, reconciliationComplete } from '../actions';

export default createTakeLatestSagaSet(actions.attemptReconciliation, function* worker() {
	// This is a dutty hack. This handles when a rename occurs (unlink->add), as we want to ensure that the add event
	// has occurred, so we don't remove tabs that haven't really been deleted!
	// TODO(afr): One day, build a rename wrapper around chokidar
	yield delay(100);

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

			// No action needed for these tabs
			case 'new_project_intro':
				break;

			default:
				// @ts-expect-error
				yield put(closeTab(tab.payload));
		}
	}

	yield put(reconciliationComplete());
});
