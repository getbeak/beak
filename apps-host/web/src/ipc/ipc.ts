import type { IpcMainListener, PartialIpcMain } from '@beak/common/ipc/main';
import type { IpcMessage } from '@beak/common/ipc/types';
import type { IpcMainInvokeEvent, IpcRendererEvent, WebContents } from 'electron';

type RendererListener = (event: IpcRendererEvent, ...args: unknown[]) => void;

/**
 * Web shim for Electron's `ipcMain` + `secureBridge.ipc` pair.
 *
 * Two channels:
 *  - `invoke` — the renderer calls a request handler registered via `handle()`
 *    (mirrors Electron's `ipcMain.handle` / `ipcRenderer.invoke`).
 *  - `emit`   — main-side code pushes an event to every renderer listener
 *    subscribed via `secureBridge.ipc.on()` (mirrors `webContents.send` +
 *    `ipcRenderer.on`).
 *
 * `index.html` defines a tiny `secureBridge.ipc` stub so early modules don't
 * NPE; the constructor below replaces that stub with the real wiring.
 */
class WebIpcMain implements PartialIpcMain {
	private channelListeners: Record<string, IpcMainListener> = {};
	private eventListeners: Record<string, Set<RendererListener>> = {};

	constructor() {
		window.secureBridge.ipc.invoke = (channel: string, payload: IpcMessage) => {
			const channelListener = this.channelListeners[channel];

			if (!channelListener) throw new Error(`Channel ${channel} has no listeners`);

			return channelListener(null as unknown as IpcMainInvokeEvent, payload);
		};

		window.secureBridge.ipc.on = (channel: string, listener: RendererListener) => {
			(this.eventListeners[channel] ??= new Set()).add(listener);
		};

		window.secureBridge.ipc.off = (channel: string, listener: RendererListener) => {
			this.eventListeners[channel]?.delete(listener);
		};
	}

	handle(channel: string, listener: IpcMainListener) {
		this.channelListeners[channel] = listener;
	}

	/** Push an event to every renderer listener on `channel`. No-op when no one is listening. */
	emit(channel: string, ...args: unknown[]) {
		const listeners = this.eventListeners[channel];
		if (!listeners) return;

		const event = { sender: null } as unknown as IpcRendererEvent;
		for (const listener of listeners) listener(event, ...args);
	}

	/**
	 * Drop-in stand-in for Electron's `WebContents` so existing
	 * `service.sendXxx(webContents, payload)` call sites work unchanged on the web.
	 * `webContents.send(channel, msg)` fans out to every renderer listener on
	 * that channel via `emit`.
	 */
	readonly webContents = {
		send: (channel: string, message: IpcMessage) => this.emit(channel, message),
	} as unknown as WebContents;
}

export const webIpcMain = new WebIpcMain();
