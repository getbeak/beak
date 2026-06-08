/**
 * Port: Dialog
 *
 * Abstracts native/browser modal prompts — message boxes, file pickers, and
 * confirm dialogs — so the IPC handlers are host-agnostic thin delegates.
 * Each shell supplies a concrete adapter:
 *
 *   Electron  — apps-host/electron/src/adapters/dialog.ts
 *   Web       — apps-host/web/src/adapters/dialog.ts
 *
 * Types are defined here (not re-exported from `electron`) so this port can
 * live in `@beak/runtime-shared`, which has no Electron dependency.
 */

// ---------------------------------------------------------------------------
// Shared option / result shapes (mirror the Electron API surface the IPC
// already exposes — adapters map to/from host-native types as needed).
// ---------------------------------------------------------------------------

export interface MessageBoxButton {
	label: string;
}

export type MessageBoxType = 'none' | 'info' | 'error' | 'question' | 'warning';

export type OpenDialogProperty =
	| 'createDirectory'
	| 'dontAddToRecent'
	| 'multiSelections'
	| 'noResolveAliases'
	| 'openDirectory'
	| 'openFile'
	| 'promptToCreate'
	| 'showHiddenFiles'
	| 'treatPackageAsDirectory';

export interface ShowMessageBoxOptions {
	/** Dialog title shown in the OS title-bar (ignored on macOS). */
	title?: string;
	/** Dialog icon style. */
	type?: MessageBoxType;
	/** Primary message text. */
	message: string;
	/** Secondary detail text shown below the message. */
	detail?: string;
	/** Button labels. Defaults to `['OK']` when empty. */
	buttons?: string[];
	/** Zero-based index of the default (focused) button. */
	defaultId?: number;
	/** Zero-based index of the button triggered by the Escape key. */
	cancelId?: number;
	/** Label for an optional checkbox shown below the message. */
	checkboxLabel?: string;
	/** Initial state of the checkbox. */
	checkboxChecked?: boolean;
}

export interface ShowMessageBoxResult {
	/** Zero-based index of the button the user clicked. */
	response: number;
	/** Whether the optional checkbox was checked when the dialog was closed. */
	checkboxChecked: boolean;
}

export interface ShowOpenDialogOptions {
	/** Dialog title (ignored on macOS). */
	title?: string;
	/** Label for the confirmation button. */
	buttonLabel?: string;
	/** File-type filters, e.g. `[{ name: 'JSON', extensions: ['json'] }]`. */
	filters?: Array<{ name: string; extensions: string[] }>;
	/** Picker behaviour flags. */
	properties?: OpenDialogProperty[];
	/** Default path shown when the picker opens. */
	defaultPath?: string;
}

export interface ShowOpenDialogResult {
	/** `true` when the user dismissed the picker without selecting anything. */
	canceled: boolean;
	/** Paths selected by the user; empty when `canceled` is `true`. */
	filePaths: string[];
}

export interface ConfirmOptions {
	/** Dialog title (ignored on macOS). */
	title?: string;
	/** Primary message text. */
	message: string;
	/** Secondary detail text. */
	detail?: string;
	/** Label for the "confirm" (affirmative) button. Defaults to `'OK'`. */
	confirmLabel?: string;
	/** Label for the "cancel" button. Defaults to `'Cancel'`. */
	cancelLabel?: string;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export default interface Dialog {
	/**
	 * Show a message-box dialog with arbitrary buttons and return the result.
	 * Resolves once the user dismisses the dialog.
	 */
	showMessageBox(opts: ShowMessageBoxOptions): Promise<ShowMessageBoxResult>;

	/**
	 * Show a file/folder open picker and return the paths selected.
	 * Returns `{ canceled: true, filePaths: [] }` when the user cancels.
	 */
	showOpenDialog(opts: ShowOpenDialogOptions): Promise<ShowOpenDialogResult>;

	/**
	 * Convenience wrapper: show a two-button confirm dialog and return `true`
	 * when the user presses the affirmative button, `false` otherwise.
	 *
	 * Implemented in terms of `showMessageBox` — adapters need not override it.
	 */
	confirm(opts: ConfirmOptions): Promise<boolean>;
}
