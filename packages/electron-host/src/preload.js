process.once('loaded', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { contextBridge, ipcRenderer } = require('electron');

	contextBridge.exposeInMainWorld('ipc', {
		invoke: async (channel, payload) => ipcRenderer.invoke(channel, payload),
		on: (channel, listener) => ipcRenderer.on(channel, listener),
		removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
	});
});

