import { createAsyncAction } from '@beak/app/utils/redux/async-actions';

import {
	ActionTypes,
	AuthenticateUserResponse,
	HandleMagicLinkPayload,
	SendMagicLinkPayload,
} from './types';

export const handleMagicLink = createAsyncAction<HandleMagicLinkPayload, AuthenticateUserResponse>(
	ActionTypes.HANDLE_MAGIC_LINK,
);

export const sendMagicLink = createAsyncAction<SendMagicLinkPayload>(ActionTypes.SEND_MAGIC_LINK);

export default {
	handleMagicLink,
	sendMagicLink,
};
