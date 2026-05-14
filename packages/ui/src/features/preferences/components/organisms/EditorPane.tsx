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

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getEditorOverview().then(prefs => {
			if (!cancelled) setEditorPreferences(prefs);
		});
		return () => {
			cancelled = true;
		};
	}, []);

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
				<ItemInfo>{'By default, the editor theme will use Beak’s current theme.'}</ItemInfo>
			</ItemGroup>

			<ItemGroup>
				<ItemLabel>{'Font size'}</ItemLabel>
				<Input
					$beakSize='sm'
					$noStretch
					aria-label='Editor font size'
					type='number'
					min={8}
					max={32}
					style={{ width: '90px' }}
					value={editorPreferences.fontSize}
					onChange={event => {
						const raw = Number(event.currentTarget.value);
						if (!Number.isFinite(raw)) return;
						const clamped = Math.min(32, Math.max(8, Math.round(raw)));
						updateEditorPreference('fontSize', clamped);
					}}
				/>
				<ItemInfo>{'Applies to the Monaco editor inside Beak (request/response bodies, raw views).'}</ItemInfo>
			</ItemGroup>
		</Pane>
	);
};

export default EditorPane;
