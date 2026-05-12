import type { IpcMainListener, PartialIpcMain } from '@beak/common/ipc/main';
import type { IpcMessage } from '@beak/common/ipc/types';
import type { IpcMainInvokeEvent } from 'electron';

class WebIpcMain implements PartialIpcMain {
	private channelListeners: Record<string, IpcMainListener> = {};

	constructor() {
		window.secureBridge.ipc.invoke = (channel: string, payload: IpcMessage) => {
			const channelListener = this.channelListeners[channel];

			if (!channelListener) throw new Error(`Channel ${channel} has no listeners`);

			return channelListener(null as unknown as IpcMainInvokeEvent, payload);
		};
	}

	handle(channel: string, listener: IpcMainListener) {
		this.channelListeners[channel] = listener;
	}
}

export const webIpcMain = new WebIpcMain();
