import '@getbeak/extension-sdk';

declare module '@getbeak/extension-sdk' {
	interface VariableBase {
		type: string;
		external: boolean;
	}
}
