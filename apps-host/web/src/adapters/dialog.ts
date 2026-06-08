import type {
	ConfirmOptions,
	ShowMessageBoxOptions,
	ShowMessageBoxResult,
	ShowOpenDialogOptions,
	ShowOpenDialogResult,
} from '@beak/runtime-shared/ports/dialog';
import type Dialog from '@beak/runtime-shared/ports/dialog';

/**
 * Web adapter for the Dialog port.
 *
 * Uses `window.alert` / `window.confirm` as a lightweight shim while the
 * renderer-driven modal (`<DialogHost />`) is not yet wired up.
 *
 * TODO: replace with a renderer-driven modal routed via a custom event /
 * postMessage to a mounted <DialogHost /> React component. The current shim
 * is a functional improvement over the previous bare `alert()` calls (confirm
 * now returns a meaningful boolean) but is not a native-feeling experience.
 * Tracked as a follow-up to ADR 0006 §3.
 */
export default class WebDialog implements Dialog {
	async showMessageBox(opts: ShowMessageBoxOptions): Promise<ShowMessageBoxResult> {
		window.alert([opts.title && `[${opts.title}]`, opts.message, opts.detail].filter(Boolean).join('\n'));

		return { response: 0, checkboxChecked: opts.checkboxChecked ?? false };
	}

	async showOpenDialog(_opts: ShowOpenDialogOptions): Promise<ShowOpenDialogResult> {
		// Web has no native folder picker yet — the clone flow on web supplies a
		// virtual OPFS path directly, no chooser needed. When the File System
		// Access API is wired as the third storage mode this stub will return the
		// picked handle's resolved path.
		return { canceled: true, filePaths: [] };
	}

	async confirm(opts: ConfirmOptions): Promise<boolean> {
		const lines = [opts.title && `[${opts.title}]`, opts.message, opts.detail].filter(Boolean).join('\n');

		return window.confirm(lines);
	}
}
