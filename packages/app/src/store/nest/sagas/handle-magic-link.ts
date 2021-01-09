import NestClient from '@beak/app/lib/nest-client';
import { createTakeEverySagaSet } from '@beak/app/utils/redux/sagas';
import Squawk from '@beak/common/utils/squawk';
import { call, getContext, put } from 'redux-saga/effects';

import { actions } from '..';
import { AuthenticateUserResponse } from '../types';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export default createTakeEverySagaSet(actions.handleMagicLink.request, function* handleMagicLinkWorker(action) {
	const client: NestClient = yield getContext('client');
	const { code, state } = action.payload;

	try {
		const authentication: AuthenticateUserResponse = yield call([client, client.handleMagicLink], code, state);

		yield put(actions.handleMagicLink.success(authentication));

		ipcRenderer.send('nest:set_user', authentication.userId, true);
	} catch (error) {
		yield put(actions.handleMagicLink.failure(Squawk.coerce(error)));
	}
});
