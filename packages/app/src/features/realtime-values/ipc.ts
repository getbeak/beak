import { ipcExtensionsService } from '@beak/app/lib/ipc';
import { ExtensionsMessages, RtvParseValuePartsResponse } from '@beak/common/ipc/extensions';
import { RequestPayload } from '@beak/common/ipc/ipc';

import { parseValueParts } from './parser';

ipcExtensionsService.registerRtvParseValueParts(async (event, payload) => {
	const parsed = await parseValueParts(payload.context, payload.parts, payload.recursiveDepth);
	const message: RequestPayload<RtvParseValuePartsResponse> = {
		code: ExtensionsMessages.RtvParseValuePartsResponse,
		payload: {
			parsed,
			uniqueSessionId: payload.uniqueSessionId,
		},
	};

	event.sender.send(ipcExtensionsService.getChannel(), message);
});
