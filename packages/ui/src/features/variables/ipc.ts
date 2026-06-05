import { ExtensionsMessages, type VariableParseValueSectionsResponse } from '@beak/common/ipc/extensions';
import type { IpcMessage } from '@beak/common/ipc/types';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';

import { parseValueSections } from './parser';

ipcExtensionsService.registerVariableParseValueSections(async (event, payload) => {
	const parsed = await parseValueSections(payload.context, payload.parts, payload.recursiveDepth);
	const message: IpcMessage<VariableParseValueSectionsResponse> = {
		code: ExtensionsMessages.VariableParseValueSectionsResponse,
		payload: {
			parsed,
			uniqueSessionId: payload.uniqueSessionId,
		},
	};

	event.sender.send('extensions', message);
});
