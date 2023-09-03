import type { EntryType } from '@getbeak/types/body-editor-json';

export type EditorMode = 'query' | 'variables';

export interface ExtractedVariables {
	[k: string]: EntryType;
}
