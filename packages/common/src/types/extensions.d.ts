import { RealtimeValueInformation } from '@getbeak/types-realtime-value';

export interface RealtimeValueExtension {
	name: string;
	version: string;
	filePath: string;
	valid: true;
	realtimeValue: {
		type: string;
		editable: boolean;
	} & RealtimeValueInformation;
}
