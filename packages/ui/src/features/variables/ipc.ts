import { ExtensionsMessages, RtvParseValueSectionsResponse } from '@beak/common/ipc/extensions';
import { RequestPayload } from '@beak/common/ipc/ipc';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';

import { parseValueSections } from './parser';

ipcExtensionsService.registerRtvParseValueSections(async (event, payload) => {
	const parsed = await parseValueSections(payload.context, payload.parts, payload.recursiveDepth);
	const message: RequestPayload<RtvParseValueSectionsResponse> = {
		code: ExtensionsMessages.RtvParseValueSectionsResponse,
		payload: {
			parsed,
			uniqueSessionId: payload.uniqueSessionId,
		},
	};

	event.sender.send(ipcExtensionsService.getChannel(), message);
});
