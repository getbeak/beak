import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

export interface ApplicationState {

}

function createRootReducer() {
	return combineReducers<ApplicationState>({});
}

function* rootSaga() {
	yield all([]);
}

export function configureStore() {
	const composeEnhancers = composeWithDevTools({});
	const sagaMiddleware = createSagaMiddleware();
	const initialState: ApplicationState = {};

	const store = createStore(
		createRootReducer(),
		initialState,
		composeEnhancers(applyMiddleware(sagaMiddleware)),
	);

	const context = {};

	sagaMiddleware.setContext(context);
	sagaMiddleware.run(rootSaga);

	return store;
}
