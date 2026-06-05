import type { EditorPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import Input from '@beak/ui/components/atoms/Input';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { Monitor, Moon, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Row from '../atoms/Row';
import Section from '../atoms/Section';
import SegmentedControl from '../atoms/SegmentedControl';

const THEME_ITEMS = [
	{ key: 'system' as const, label: 'Default', preview: <Monitor size={14} strokeWidth={1.8} /> },
	{ key: 'light' as const, label: 'Light', preview: <Sun size={14} strokeWidth={1.8} /> },
	{ key: 'dark' as const, label: 'Dark', preview: <Moon size={14} strokeWidth={1.8} /> },
];

const EditorPane: React.FC = () => {
	const [prefs, setPrefs] = useState<EditorPreferences>();

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getEditorOverview().then(p => {
			if (!cancelled) setPrefs(p);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	async function update<Key extends keyof EditorPreferences>(key: Key, value: EditorPreferences[Key]) {
		await ipcPreferencesService.setEditorValue(key, value);
		setPrefs(await ipcPreferencesService.getEditorOverview());
	}

	if (!prefs) return null;

	return (
		<>
			<Section
				title='Code editor'
				description='Applies to the Monaco editor inside Beak — request and response bodies, raw views.'
			>
				<Row label='Theme override' description='By default, the editor follows Beak’s theme.'>
					<SegmentedControl
						ariaLabel='Editor theme override'
						items={THEME_ITEMS}
						value={prefs.themeOverride as ThemeMode}
						onChange={mode => update('themeOverride', mode)}
					/>
				</Row>
				<Row label='Font size' description='Between 8 and 32 pixels.'>
					<Input
						$beakSize='sm'
						$noStretch
						aria-label='Editor font size'
						type='number'
						min={8}
						max={32}
						style={{ width: '74px', textAlign: 'right' }}
						value={prefs.fontSize}
						onChange={event => {
							const raw = Number(event.currentTarget.value);
							if (!Number.isFinite(raw)) return;
							const clamped = Math.min(32, Math.max(8, Math.round(raw)));
							update('fontSize', clamped);
						}}
					/>
				</Row>
			</Section>
		</>
	);
};

export default EditorPane;
