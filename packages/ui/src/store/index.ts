import createSagaMiddleware from '@redux-saga/core';
import { all, fork } from '@redux-saga/core/effects';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import * as encryptionStore from '../features/encryption/store';
import { State as EncryptionState } from '../features/encryption/store/types';
import * as omniBarStore from '../features/omni-bar/store';
import { State as OmniBarState } from '../features/omni-bar/store/types';
import * as tabsStore from '../features/tabs/store';
import { State as TabsState } from '../features/tabs/store/types';
import { handleUnhandledError } from '../utils/unhandled-error-handler';
import * as arbiterStore from './arbiter';
import { State as ArbiterState } from './arbiter/types';
import * as extensionsStore from './extensions';
import { State as ExtensionsState } from './extensions/types';
import * as flightStore from './flight';
import { State as FlightState } from './flight/types';
import * as gitStore from './git';
import { State as GitState } from './git/types';
import * as preferencesStore from './preferences';
import { State as PreferencesState } from './preferences/types';
import * as projectStore from './project';
import { State as ProjectState } from './project/types';
import * as variableSetsStore from './variable-sets';
import { State as VariableSetState } from './variable-sets/types';

export interface ApplicationState {
	features: {
		encryption: EncryptionState;
		omniBar: OmniBarState;
		tabs: TabsState;
	};
	global: {
		arbiter: ArbiterState;
		extensions: ExtensionsState;
		flight: FlightState;
		git: GitState;
		preferences: PreferencesState;
		project: ProjectState;
		variableSets: VariableSetState;
	};
}

function createRootReducer() {
	return combineReducers<ApplicationState>({
		features: combineReducers({
			encryption: encryptionStore.reducer,
			omniBar: omniBarStore.reducer,
			tabs: tabsStore.reducer,
		}),
		global: combineReducers({
			arbiter: arbiterStore.reducers,
			extensions: extensionsStore.reducers,
			flight: flightStore.reducers,
			git: gitStore.reducers,
			preferences: preferencesStore.reducers,
			project: projectStore.reducers,
			variableSets: variableSetsStore.reducers,
		}),
	});
}

function* rootSaga() {
	yield all([
		fork(arbiterStore.sagas),
		fork(extensionsStore.sagas),
		fork(flightStore.sagas),
		fork(tabsStore.sagas),
		fork(gitStore.sagas),
		fork(preferencesStore.sagas),
		fork(projectStore.sagas),
		fork(variableSetsStore.sagas),
	]);
}

function createInitialState(): ApplicationState {
	return {
		features: {
			encryption: encryptionStore.types.initialState,
			omniBar: omniBarStore.types.initialState,
			tabs: tabsStore.types.initialState,
		},
		global: {
			arbiter: arbiterStore.types.initialState,
			extensions: extensionsStore.types.initialState,
			flight: flightStore.types.initialState,
			git: gitStore.types.initialState,
			preferences: preferencesStore.types.initialState,
			project: projectStore.types.initialState,
			variableSets: variableSetsStore.types.initialState,
		},
	};
}

export function configureStore(): Store<ApplicationState> {
	const initialState = createInitialState();
	const composeEnhancers = composeWithDevTools({});

	const sagaMiddleware = createSagaMiddleware({
		onError: error => handleUnhandledError(error),
	});

	const store = createStore(
		createRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(sagaMiddleware)),
	);

	sagaMiddleware.run(rootSaga);
	store.dispatch(arbiterStore.actions.startArbiter());

	return store;
}
