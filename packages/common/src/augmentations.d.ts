import '@getbeak/types-realtime-value';

declare module '@getbeak/types-realtime-value' {
	interface RealtimeValueBase {
		type: string;
		external: boolean;
	}
}
