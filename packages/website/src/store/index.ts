import { connectRouter, routerMiddleware } from 'connected-react-router';
import type { History } from 'history';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';

export interface ApplicationState { }

function createRootReducer(history: History) {
	return combineReducers<ApplicationState>({
		router: connectRouter(history),
	});
}

function createInitialState(): ApplicationState {
	return { };
}

export function configureStore(history: History) {
	const initialState = createInitialState();

	const store = createStore(
		createRootReducer(history),
		initialState,
		compose(applyMiddleware(routerMiddleware(history))),
	);

	return store;
}
