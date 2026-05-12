// Flight slice lives in @beak/core (pure domain), used here as a global state shard.
import { type FlightSliceState, flightSlice } from '@beak/core/flight';
import { applyMiddleware, combineReducers, createStore, type Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import * as encryptionStore from '../features/encryption/store';
import type { State as EncryptionState } from '../features/encryption/store/types';
import * as omniBarStore from '../features/omni-bar/store';
import type { State as OmniBarState } from '../features/omni-bar/store/types';
import * as tabsStore from '../features/tabs/store';
import type { State as TabsState } from '../features/tabs/store/types';
import * as arbiterStore from './arbiter';
import type { State as ArbiterState } from './arbiter/types';
import * as extensionsStore from './extensions';
import type { State as ExtensionsState } from './extensions/types';
import * as gitStore from './git';
import type { State as GitState } from './git/types';
import { registerAllEffects } from './effects';
import { listenerMiddleware } from './listener';
import * as preferencesStore from './preferences';
import type { State as PreferencesState } from './preferences/types';
import * as projectStore from './project';
import type { State as ProjectState } from './project/types';
import * as variableSetsStore from './variable-sets';
import type { State as VariableSetState } from './variable-sets/types';

export interface ApplicationState {
	features: {
		encryption: EncryptionState;
		omniBar: OmniBarState;
		tabs: TabsState;
	};
	global: {
		arbiter: ArbiterState;
		extensions: ExtensionsState;
		flight: FlightSliceState;
		git: GitState;
		preferences: PreferencesState;
		project: ProjectState;
		variableSets: VariableSetState;
	};
}

function createRootReducer() {
	return combineReducers({
		features: combineReducers({
			encryption: encryptionStore.reducer,
			omniBar: omniBarStore.reducer,
			tabs: tabsStore.reducer,
		}),
		global: combineReducers({
			arbiter: arbiterStore.reducers,
			extensions: extensionsStore.reducers,
			flight: flightSlice,
			git: gitStore.reducers,
			preferences: preferencesStore.reducers,
			project: projectStore.reducers,
			variableSets: variableSetsStore.reducers,
		}),
	});
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
			flight: {
				flightStates: {},
				flightHistories: {},
				activeFlights: {},
				loading: {},
				errors: {},
			},
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

	const store = createStore(
		createRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(listenerMiddleware.middleware)),
	) as Store<ApplicationState>;

	registerAllEffects();

	return store;
}
