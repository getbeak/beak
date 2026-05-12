import { ExtensionsMessages, type RtvParseValueSectionsResponse } from '@beak/common/ipc/extensions';
import type { IpcMessage } from '@beak/common/ipc/types';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';

import { parseValueSections } from './parser';

ipcExtensionsService.registerRtvParseValueSections(async (event, payload) => {
	const parsed = await parseValueSections(payload.context, payload.parts, payload.recursiveDepth);
	const message: IpcMessage<RtvParseValueSectionsResponse> = {
		code: ExtensionsMessages.RtvParseValueSectionsResponse,
		payload: {
			parsed,
			uniqueSessionId: payload.uniqueSessionId,
		},
	};

	event.sender.send('extensions', message);
});
