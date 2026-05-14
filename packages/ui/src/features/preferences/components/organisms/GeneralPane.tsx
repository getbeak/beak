import type { ThemeMode } from '@beak/common/types/theme';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import React from 'react';
import { useEffect, useState } from 'react';

import { SelectContainer, SelectItem, SelectItemPreview } from '../atoms/fancy-select';
import { ItemGroup, ItemLabel } from '../atoms/item';
import NotificationsItem from '../molecules/NotificationsItem';
import Pane from '../molecules/Pane';

const GeneralPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system');

	async function updateSelected() {
		const themeMode = await ipcPreferencesService.getThemeMode();

		setSelectedTheme(themeMode);
	}

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getThemeMode().then(themeMode => {
			if (!cancelled) setSelectedTheme(themeMode);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Pane title={'General'}>
			<ItemGroup>
				<ItemLabel>{'Theme'}</ItemLabel>
				<SelectContainer>
					<SelectItem
						$active={selectedTheme === 'system'}
						onClick={async () => {
							await ipcPreferencesService.switchThemeMode('system');
							await updateSelected();
						}}
					>
						<SelectItemPreview $active={selectedTheme === 'system'} $themeMode={'system'} />
						{'System'}
					</SelectItem>
					<SelectItem
						$active={selectedTheme === 'light'}
						onClick={async () => {
							await ipcPreferencesService.switchThemeMode('light');
							await updateSelected();
						}}
					>
						<SelectItemPreview $active={selectedTheme === 'light'} $themeMode={'light'} />
						{'Light'}
					</SelectItem>
					<SelectItem
						$active={selectedTheme === 'dark'}
						onClick={async () => {
							await ipcPreferencesService.switchThemeMode('dark');
							await updateSelected();
						}}
					>
						<SelectItemPreview $active={selectedTheme === 'dark'} $themeMode={'dark'} />
						{'Dark'}
					</SelectItem>
				</SelectContainer>
			</ItemGroup>

			<NotificationsItem />
		</Pane>
	);
};

export default GeneralPane;
