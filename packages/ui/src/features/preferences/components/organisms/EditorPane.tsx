import type { EditorPreferences } from '@beak/common/types/preferences';
import Input from '@beak/ui/components/atoms/Input';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import React from 'react';
import { useEffect, useState } from 'react';

import { SelectContainer, SelectItem, SelectItemPreview } from '../atoms/fancy-select';
import { ItemGroup, ItemInfo, ItemLabel } from '../atoms/item';
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

	if (!editorPreferences) return null;

	return (
		<Pane title={'Rich text editor'}>
			<ItemGroup>
				<ItemLabel>{'Theme override'}</ItemLabel>
				<SelectContainer>
					<SelectItem
						$active={editorPreferences.themeOverride === 'system'}
						onClick={() => updateEditorPreference('themeOverride', 'system')}
					>
						<SelectItemPreview
							$active={editorPreferences.themeOverride === 'system'}
							$themeMode={'system'}
							$themeType={'editor'}
						/>
						{'Default'}
					</SelectItem>
					<SelectItem
						$active={editorPreferences.themeOverride === 'light'}
						onClick={() => updateEditorPreference('themeOverride', 'light')}
					>
						<SelectItemPreview
							$active={editorPreferences.themeOverride === 'light'}
							$themeMode={'light'}
							$themeType={'editor'}
						/>
						{'Light'}
					</SelectItem>
					<SelectItem
						$active={editorPreferences.themeOverride === 'dark'}
						onClick={() => updateEditorPreference('themeOverride', 'dark')}
					>
						<SelectItemPreview
							$active={editorPreferences.themeOverride === 'dark'}
							$themeMode={'dark'}
							$themeType={'editor'}
						/>
						{'Dark'}
					</SelectItem>
				</SelectContainer>
				<ItemInfo>{"By default, the editor theme will use Beak's current theme."}</ItemInfo>
			</ItemGroup>

			<ItemGroup>
				<ItemLabel>{'Font size'}</ItemLabel>
				<Input
					$beakSize='sm'
					$noStretch
					type='number'
					min={8}
					max={32}
					style={{ width: '90px' }}
					value={editorPreferences.fontSize}
					onChange={event => updateEditorPreference('fontSize', Number(event.currentTarget.value ?? 0))}
				/>
				<ItemInfo>{'Applies to the Monaco editor inside Beak (request/response bodies, raw views).'}</ItemInfo>
			</ItemGroup>
		</Pane>
	);
};

export default EditorPane;
