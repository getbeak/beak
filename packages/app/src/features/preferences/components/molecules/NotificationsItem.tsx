import React, { useEffect, useState } from 'react';
import Checkbox from '@beak/app/components/atoms/Checkbox';
import { ipcPreferencesService } from '@beak/app/lib/ipc';
import { NotificationPreferences } from '@beak/common/types/preferences';

import { ItemGroup, ItemLabel, SubItem, SubItemGroup, SubItemLabel } from '../atoms/item';
import NotificationStateSelect from '../atoms/NotificationStateSelect';

const NotificationsItem: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>();

	useEffect(() => void getNotificationPreferences(), []);

	function getNotificationPreferences() {
		ipcPreferencesService.getNotificationOverview().then(setNotificationPreferences);
	}

	// eslint-disable-next-line max-len
	function setNotificationValue<Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) {
		ipcPreferencesService.setNotificationValue(key, value);
	}

	// eslint-disable-next-line max-len
	function updateNotificationPreference<Key extends keyof NotificationPreferences>(key: Key, value: NotificationPreferences[Key]) {
		ipcPreferencesService.setNotificationValue(key, value).then(getNotificationPreferences);
	}

	if (!notificationPreferences)
		return null;

	return (
		<ItemGroup>
			<ItemLabel>{'Notifications:'}</ItemLabel>

			<SubItemGroup>
				<SubItem>
					<SubItemLabel>{'Successful requests: '}</SubItemLabel>
					<NotificationStateSelect
						value={notificationPreferences.onSuccessfulRequest}
						onChange={value => updateNotificationPreference('onSuccessfulRequest', value)}
					/>
				</SubItem>
				<SubItem>
					<abbr title={'Requests where the HTTP status code is in the information range (100-199) or in the redirection range (300-399).'}>
						<SubItemLabel>{'Information & redirect requests: '}</SubItemLabel>
					</abbr>
					<NotificationStateSelect
						value={notificationPreferences.onInformationRequest}
						onChange={value => setNotificationValue('onInformationRequest', value)}
					/>
				</SubItem>
				<SubItem>
					<SubItemLabel>{'Failed requests: '}</SubItemLabel>
					<NotificationStateSelect
						value={notificationPreferences.onFailedRequest}
						onChange={value => setNotificationValue('onFailedRequest', value)}
					/>
				</SubItem>
				{/* Disabled for now */}
				{/* <SubItem>
					<SubItemLabel>{'Update available: '}</SubItemLabel>
					<NotificationStateSelect
						value={notificationPreferences.onUpdateAvailable}
						onChange={value => setNotificationValue('onUpdateAvailable', value)}
					/>
				</SubItem> */}
				<SubItem>
					<Checkbox
						id={'showRequestNotificationWhenFocused'}
						checked={notificationPreferences.showRequestNotificationWhenFocused}
						label={'Show notification banners when Beak has focus'}
						onChange={event => setNotificationValue('showRequestNotificationWhenFocused', event.currentTarget.checked)}
					/>
				</SubItem>
			</SubItemGroup>
		</ItemGroup>
	);
};

export default NotificationsItem;
