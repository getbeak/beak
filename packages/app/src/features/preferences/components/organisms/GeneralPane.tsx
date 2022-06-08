import React from 'react';
import { ipcPreferencesService } from '@beak/app/lib/ipc';

import { SelectContainer, SelectItem, SelectItemPreview } from '../atoms/fancy-select';
import { ItemGroup, ItemInfo, ItemLabel } from '../atoms/item';
import Pane from '../molecules/Pane';

const GeneralPane: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Pane title={'General'}>
		<ItemGroup>
			<ItemLabel>{'Theme:'}</ItemLabel>
			<SelectContainer>
				<SelectItem onClick={() => ipcPreferencesService.switchThemeMode('system')}>
					<SelectItemPreview />
					{'System'}
				</SelectItem>
				<SelectItem onClick={() => ipcPreferencesService.switchThemeMode('light')}>
					<SelectItemPreview />
					{'Light'}
				</SelectItem>
				<SelectItem onClick={() => ipcPreferencesService.switchThemeMode('dark')}>
					<SelectItemPreview $active />
					{'Dark'}
				</SelectItem>
			</SelectContainer>
			<ItemInfo>{'Theme switching is coming soon'}</ItemInfo>
		</ItemGroup>
	</Pane>
);

export default GeneralPane;
