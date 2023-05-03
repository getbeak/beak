import { TabSubItem } from '@beak/app/components/atoms/TabItem';

import { EditorMode } from './types';

export const editorTabSubItems: TabSubItem<EditorMode>[] = [{
	key: 'query',
	label: 'Query',
}, {
	key: 'variables',
	label: 'Variables',
}];
