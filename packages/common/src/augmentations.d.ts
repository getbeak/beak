// biome-ignore lint/style/noRestrictedImports: declarative augmentation of the extension SDK module's VariableBase. Type-only; no runtime dependency.
import '@getbeak/extension-sdk';

declare module '@getbeak/extension-sdk' {
	interface VariableBase {
		type: string;
		external: boolean;
	}
}
