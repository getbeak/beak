import '@getbeak/types-variables';

declare module '@getbeak/types-variables' {
	interface VariableBase {
		type: string;
		external: boolean;
	}
}
