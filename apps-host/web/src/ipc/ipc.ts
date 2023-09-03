import { IpcMainListener, IpcMessage, PartialIpcMain } from '@beak/common/ipc/ipc';
import type { IpcMainInvokeEvent } from 'electron';

class WebIpcMain implements PartialIpcMain {
	private channelListeners: Record<string, IpcMainListener> = {};

	constructor() {
		window.secureBridge.ipc.invoke = <T>(channel: string, payload: IpcMessage) => {
			const channelListener = this.channelListeners[channel];

			if (!channelListener)
				throw new Error(`Channel ${channel} has no listeners`);

			return channelListener<T>(null as unknown as IpcMainInvokeEvent, payload);
		};
	}

	handle(channel: string, listener: IpcMainListener) {
		this.channelListeners[channel] = listener;
	}
}

export const webIpcMain = new WebIpcMain();
