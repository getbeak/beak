import React, { useEffect, useState } from 'react';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { ThemeMode } from '@beak/common/types/theme';

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

	useEffect(() => void updateSelected(), []);

	return (
		<Pane title={'General'}>
			<ItemGroup>
				<ItemLabel>{'Theme:'}</ItemLabel>
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
