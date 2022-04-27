import type { History } from 'history';
import { combineReducers, createStore } from 'redux';

export interface ApplicationState { }

function createRootReducer(_history: History) {
	return combineReducers<ApplicationState>({ });
}

function createInitialState(): ApplicationState {
	return { };
}

export function configureStore(history: History) {
	const initialState = createInitialState();

	const store = createStore(
		createRootReducer(history),
		initialState,
		// compose(applyMiddleware(middleware(history))),
	);

	return store;
}
