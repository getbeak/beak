import type { Context as VariableContext } from '@getbeak/types/values';

/**
 * Shell-agnostic handle for sending events back to the requesting renderer.
 *
 * Electron: wraps `IpcMainInvokeEvent.sender` (a `WebContents`).
 * Web: wraps `webIpcMain.webContents` (which fans out via `emit`).
 *
 * By accepting this interface, the extension managers and IPC handlers never
 * import from `electron` for send-side operations.
 */
export interface ExtensionSender {
	send(channel: string, payload: unknown): void;
}

/**
 * Port that owns extension loading, lifecycle, and variable invocation.
 * Both the Electron host (isolated-vm) and the Web host (Web Workers) supply a
 * concrete adapter. IPC handlers call through this interface; neither host's
 * manager is visible at the call site.
 *
 * ADR 0006 §3 — decouple ExtensionManager from IpcMainInvokeEvent so the web
 * host can run extensions without Electron primitives.
 */
export default abstract class ExtensionRuntime {
	/**
	 * Load an extension into its sandbox. Idempotent — re-loading the same
	 * package replaces the existing isolate/worker cleanly.
	 *
	 * @param projectId     Opaque identifier for the owning project.
	 * @param projectFolder Absolute path to the project root (used for fs-sandbox validation).
	 * @param packagePath   Absolute path to the extension package directory.
	 */
	abstract load(projectId: string, projectFolder: string, packagePath: string): Promise<void>;
	abstract unload(projectId: string, packageName: string): Promise<void>;
	abstract resetProject(projectId: string): Promise<void>;

	abstract variableCreateDefaultPayload(
		projectId: string,
		type: string,
		varCtx: VariableContext,
	): Promise<Record<string, unknown>>;

	abstract variableGetValue(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
	): Promise<string>;

	abstract variableGetAssetRef(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		sender: ExtensionSender,
		payload: unknown,
		recursiveDepth: number,
	): Promise<{ sha256: string; size: number; contentType?: string } | null>;

	abstract variableEditorCreateUI(projectId: string, type: string, varCtx: VariableContext): Promise<unknown>;

	abstract variableEditorLoad(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		payload: unknown,
	): Promise<unknown>;

	abstract variableEditorSave(
		projectId: string,
		type: string,
		varCtx: VariableContext,
		existingPayload: unknown,
		state: unknown,
	): Promise<unknown>;
}
