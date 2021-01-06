import NestClient from '@beak/app/lib/nest-client';
import Squawk from '@beak/common/utils/squawk';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, getContext, put } from 'redux-saga/effects';

import { actions } from '..';
import { SendMagicLinkPayload } from '../types';

export default function* sendMagicLinkWorker({ payload }: PayloadAction<SendMagicLinkPayload>) {
	const client: NestClient = yield getContext('client');
	const { email } = payload;

	try {
		yield call([client, client.sendMagicLink], email);
		yield put(actions.sendMagicLink.success());
	} catch (error) {
		console.error(error);
		yield put(actions.sendMagicLink.failure(Squawk.coerce(error)));
	}
}
