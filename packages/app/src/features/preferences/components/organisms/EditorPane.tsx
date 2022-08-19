import React, { useEffect, useState } from 'react';
import Input from '@beak/app/components/atoms/Input';
import { ipcPreferencesService } from '@beak/app/lib/ipc';
import { EditorPreferences } from '@beak/common/types/preferences';

import { SelectContainer, SelectItem, SelectItemPreview } from '../atoms/fancy-select';
import { ItemGroup, ItemInfo, ItemLabel, SubItem, SubItemGroup, SubItemLabel } from '../atoms/item';
import Pane from '../molecules/Pane';

const EditorPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [editorPreferences, setEditorPreferences] = useState<EditorPreferences>();

	useEffect(() => void getEditorPreferences(), []);

	function getEditorPreferences() {
		ipcPreferencesService.getEditorOverview().then(setEditorPreferences);
	}

	function updateEditorPreference<Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]) {
		ipcPreferencesService.setEditorValue(key, value).then(getEditorPreferences);
	}

	if (!editorPreferences)
		return null;

	return (
		<Pane title={'Editor'}>
			<ItemGroup>
				<ItemLabel>{'Theme override:'}</ItemLabel>
				<SelectContainer>
					<SelectItem
						$active={editorPreferences.themeOverride === 'system'}
						onClick={() => updateEditorPreference('themeOverride', 'system')}
					>
						<SelectItemPreview $active={editorPreferences.themeOverride === 'system'} $themeMode={'system'} />
						{'Default'}
					</SelectItem>
					<SelectItem
						$active={editorPreferences.themeOverride === 'light'}
						onClick={() => updateEditorPreference('themeOverride', 'light')}
					>
						<SelectItemPreview $active={editorPreferences.themeOverride === 'light'} $themeMode={'light'} />
						{'Light'}
					</SelectItem>
					<SelectItem
						$active={editorPreferences.themeOverride === 'dark'}
						onClick={() => updateEditorPreference('themeOverride', 'dark')}
					>
						<SelectItemPreview $active={editorPreferences.themeOverride === 'dark'} $themeMode={'dark'} />
						{'Dark'}
					</SelectItem>
				</SelectContainer>
				<ItemInfo>{'By default, the editor theme will use the theme that Beak is using.'}</ItemInfo>
			</ItemGroup>

			<ItemGroup>
				<ItemLabel>{'Font size:'}</ItemLabel>

				<SubItemGroup>
					<SubItem>
						<SubItemLabel>{'Font size used for rich text editors: '}</SubItemLabel>
						<Input
							beakSize={'sm'}
							type={'number'}
							value={editorPreferences.fontSize}
							onChange={event => updateEditorPreference('fontSize', Number(event.currentTarget.value ?? 0))}
						/>
					</SubItem>
				</SubItemGroup>
			</ItemGroup>
		</Pane>
	);
};

export default EditorPane;
