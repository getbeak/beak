import type { NotificationPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import Checkbox from '@beak/ui/components/atoms/Checkbox';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import type { IpcRendererEvent } from 'electron';
import { Monitor, Moon, Sun } from 'lucide-react';
import React from 'react';
import { useEffect, useState } from 'react';

import NotificationStateSelect from '../atoms/NotificationStateSelect';
import Row from '../atoms/Row';
import Section from '../atoms/Section';
import SegmentedControl from '../atoms/SegmentedControl';

const THEME_ITEMS = [
	{ key: 'system' as const, label: 'System', preview: <Monitor size={14} strokeWidth={1.8} /> },
	{ key: 'light' as const, label: 'Light', preview: <Sun size={14} strokeWidth={1.8} /> },
	{ key: 'dark' as const, label: 'Dark', preview: <Moon size={14} strokeWidth={1.8} /> },
];

const GeneralPane: React.FC = () => {
	const [theme, setTheme] = useState<ThemeMode>('system');
	const [notifications, setNotifications] = useState<NotificationPreferences>();

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getThemeMode().then(m => { if (!cancelled && m) setTheme(m); });
		ipcPreferencesService.getNotificationOverview().then(n => { if (!cancelled) setNotifications(n); });

		const onThemeUpdate = (_event: IpcRendererEvent, next: ThemeMode) => setTheme(next);
		window.secureBridge.ipc.on('theme_mode_updated', onThemeUpdate);
		return () => {
			cancelled = true;
			window.secureBridge.ipc.off('theme_mode_updated', onThemeUpdate);
		};
	}, []);

	async function changeTheme(next: ThemeMode) {
		await ipcPreferencesService.switchThemeMode(next);
	}

	async function updateNotification<Key extends keyof NotificationPreferences>(
		key: Key,
		value: NotificationPreferences[Key],
	) {
		await ipcPreferencesService.setNotificationValue(key, value);
		setNotifications(await ipcPreferencesService.getNotificationOverview());
	}

	return (
		<>
			<Section title='Appearance'>
				<Row label='Theme' description="Follows the system if you don't pick one.">
					<SegmentedControl
						ariaLabel='Application theme'
						items={THEME_ITEMS}
						value={theme}
						onChange={changeTheme}
					/>
				</Row>
			</Section>

			<Section
				title='Notifications'
				description='Choose how Beak announces request results.'
			>
				{notifications && (
					<>
						<Row label='Successful requests' indicator='teal'>
							<NotificationStateSelect
								label='Successful requests'
								value={notifications.onSuccessfulRequest}
								onChange={value => updateNotification('onSuccessfulRequest', value)}
							/>
						</Row>
						<Row
							label='Information & redirects'
							description='100–199 and 300–399 responses'
							indicator='indigo'
						>
							<NotificationStateSelect
								label='Information and redirect requests'
								value={notifications.onInformationRequest}
								onChange={value => updateNotification('onInformationRequest', value)}
							/>
						</Row>
						<Row label='Failed requests' indicator='alert'>
							<NotificationStateSelect
								label='Failed requests'
								value={notifications.onFailedRequest}
								onChange={value => updateNotification('onFailedRequest', value)}
							/>
						</Row>
						<Row
							label='Show notifications while Beak has focus'
							description='Off by default — the window is already in front of you.'
						>
							<Checkbox
								id='showRequestNotificationWhenFocused'
								aria-label='Show notifications while Beak has focus'
								checked={notifications.showRequestNotificationWhenFocused}
								onChange={event =>
									updateNotification('showRequestNotificationWhenFocused', event.currentTarget.checked)
								}
							/>
						</Row>
					</>
				)}
			</Section>
		</>
	);
};

export default GeneralPane;
