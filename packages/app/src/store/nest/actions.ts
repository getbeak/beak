import { createAsyncAction } from '@beak/app/utils/redux/async-actions';

import { ActionTypes, SendMagicLinkPayload } from './types';

export const sendMagicLink = createAsyncAction<SendMagicLinkPayload>(ActionTypes.SEND_MAGIC_LINK);

export default {
	sendMagicLink,
};
