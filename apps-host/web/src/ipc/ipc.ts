import type { IpcMainListener, PartialIpcMain } from '@beak/common/ipc/main';
import type { IpcMessage } from '@beak/common/ipc/types';
import type { IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent, WebContents } from 'electron';

type RendererListener = (event: IpcRendererEvent, ...args: unknown[]) => void;
type MainListener = (event: IpcMainEvent, ...args: unknown[]) => void;

/**
 * Web shim for Electron's `ipcMain` + `secureBridge.ipc` pair.
 *
 * Three pathways:
 *  - `invoke`/`handle` — renderer calls a request handler (mirrors Electron's
 *    `ipcMain.handle` / `ipcRenderer.invoke`).
 *  - `emit`            — host-side pushes an event to every renderer listener
 *    subscribed via `secureBridge.ipc.on()` (mirrors `webContents.send` +
 *    `ipcRenderer.on`).
 *  - `on` (this side)  — host-side listens for one-way messages a renderer
 *    sends via `event.sender.send(channel, message)`. Used by the
 *    extension worker's `parseValueSections` round-trip, which sends a
 *    correlated response back without going through the request/reply path.
 *
 * `index.html` defines a tiny `secureBridge.ipc` stub so early modules don't
 * NPE; the constructor below replaces that stub with the real wiring.
 */
class WebIpcMain implements PartialIpcMain {
	private channelListeners: Record<string, IpcMainListener> = {};
	private eventListeners: Record<string, Set<RendererListener>> = {};
	private mainListeners: Record<string, Set<MainListener>> = {};
	private readonly cachedSenderShim = {
		send: (channel: string, ...args: unknown[]) => {
			const listeners = this.mainListeners[channel];
			if (!listeners) return;

			const fakeEvent = { sender: this.webContents } as unknown as IpcMainEvent;
			for (const listener of listeners) listener(fakeEvent, ...args);
		},
	};

	constructor() {
		window.secureBridge.ipc.invoke = (channel: string, payload: IpcMessage) => {
			const channelListener = this.channelListeners[channel];

			if (!channelListener) throw new Error(`Channel ${channel} has no listeners`);

			return channelListener(null as unknown as IpcMainInvokeEvent, payload);
		};

		window.secureBridge.ipc.on = (channel: string, listener: RendererListener) => {
			const set = this.eventListeners[channel] ?? new Set();
			this.eventListeners[channel] = set;
			set.add(listener);
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

		// Senders see this stand-in WebContents when they call `event.sender.send(...)`
		// from a renderer-side listener — fan that out to host-side `on` listeners.
		const event = { sender: this.cachedSenderShim } as unknown as IpcRendererEvent;
		for (const listener of listeners) listener(event, ...args);
	}

	/** Subscribe to renderer→host one-way messages on `channel`. */
	on(channel: string, listener: MainListener) {
		const set = this.mainListeners[channel] ?? new Set();
		this.mainListeners[channel] = set;
		set.add(listener);
	}

	off(channel: string, listener: MainListener) {
		this.mainListeners[channel]?.delete(listener);
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
