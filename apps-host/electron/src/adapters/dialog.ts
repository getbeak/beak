import type {
	ConfirmOptions,
	ShowMessageBoxOptions,
	ShowMessageBoxResult,
	ShowOpenDialogOptions,
	ShowOpenDialogResult,
} from '@beak/runtime-shared/ports/dialog';
import type Dialog from '@beak/runtime-shared/ports/dialog';
import { dialog, type BrowserWindow } from 'electron';

/**
 * Electron adapter for the Dialog port.
 *
 * Delegates to `electron.dialog.showMessageBox` / `showOpenDialog`.
 * An optional `BrowserWindow` parent can be supplied via the constructor so
 * dialogs are parented to the correct window (sheet on macOS).
 */
export default class ElectronDialog implements Dialog {
	private readonly window?: BrowserWindow;

	constructor(window?: BrowserWindow) {
		this.window = window;
	}

	async showMessageBox(opts: ShowMessageBoxOptions): Promise<ShowMessageBoxResult> {
		const result = this.window
			? await dialog.showMessageBox(this.window, opts)
			: await dialog.showMessageBox(opts);

		return { response: result.response, checkboxChecked: result.checkboxChecked };
	}

	async showOpenDialog(opts: ShowOpenDialogOptions): Promise<ShowOpenDialogResult> {
		const result = this.window
			? await dialog.showOpenDialog(this.window, opts)
			: await dialog.showOpenDialog(opts);

		return { canceled: result.canceled, filePaths: result.filePaths };
	}

	async confirm(opts: ConfirmOptions): Promise<boolean> {
		const { response } = await this.showMessageBox({
			title: opts.title,
			message: opts.message,
			detail: opts.detail,
			type: 'question',
			buttons: [opts.confirmLabel ?? 'OK', opts.cancelLabel ?? 'Cancel'],
			defaultId: 0,
			cancelId: 1,
		});

		return response === 0;
	}
}
