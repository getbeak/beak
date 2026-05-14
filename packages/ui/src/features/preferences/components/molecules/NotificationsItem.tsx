import { Box, Flex } from '@chakra-ui/react';
import type { NotificationPreferences } from '@beak/common/types/preferences';
import Checkbox from '@beak/ui/components/atoms/Checkbox';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import React from 'react';
import { useEffect, useState } from 'react';

import { ItemGroup, ItemLabel } from '../atoms/item';
import NotificationStateSelect from '../atoms/NotificationStateSelect';

const NotificationsItem: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>();

	useEffect(() => void getNotificationPreferences(), []);

	function getNotificationPreferences() {
		ipcPreferencesService.getNotificationOverview().then(setNotificationPreferences);
	}

	function setNotificationValue<Key extends keyof NotificationPreferences>(
		key: Key,
		value: NotificationPreferences[Key],
	) {
		ipcPreferencesService.setNotificationValue(key, value);
	}

	function updateNotificationPreference<Key extends keyof NotificationPreferences>(
		key: Key,
		value: NotificationPreferences[Key],
	) {
		ipcPreferencesService.setNotificationValue(key, value).then(getNotificationPreferences);
	}

	if (!notificationPreferences) return null;

	return (
		<ItemGroup>
			<ItemLabel>{'Notifications'}</ItemLabel>

			<Flex direction='column' gap='2.5'>
				<NotificationRow
					icon={<CheckCircle2 size={12} />}
					iconColor='var(--beak-colors-accent-teal)'
					label='Successful requests'
				>
					<NotificationStateSelect
						value={notificationPreferences.onSuccessfulRequest}
						onChange={value => updateNotificationPreference('onSuccessfulRequest', value)}
					/>
				</NotificationRow>

				<NotificationRow
					icon={<Info size={12} />}
					iconColor='var(--beak-colors-accent-indigo)'
					label='Information & redirect requests'
					hint='100–199 and 300–399'
				>
					<NotificationStateSelect
						value={notificationPreferences.onInformationRequest}
						onChange={value => setNotificationValue('onInformationRequest', value)}
					/>
				</NotificationRow>

				<NotificationRow
					icon={<XCircle size={12} />}
					iconColor='var(--beak-colors-accent-alert)'
					label='Failed requests'
				>
					<NotificationStateSelect
						value={notificationPreferences.onFailedRequest}
						onChange={value => setNotificationValue('onFailedRequest', value)}
					/>
				</NotificationRow>

				<Box pt='1'>
					<Checkbox
						id='showRequestNotificationWhenFocused'
						checked={notificationPreferences.showRequestNotificationWhenFocused}
						label='Show notification banners when Beak has focus'
						onChange={event =>
							setNotificationValue('showRequestNotificationWhenFocused', event.currentTarget.checked)
						}
					/>
				</Box>
			</Flex>
		</ItemGroup>
	);
};

interface NotificationRowProps {
	icon: React.ReactNode;
	iconColor: string;
	label: string;
	hint?: string;
	children: React.ReactNode;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ icon, iconColor, label, hint, children }) => (
	<Flex align='center' gap='2.5'>
		<Flex
			flex='0 0 auto'
			align='center'
			justify='center'
			w='26px'
			h='26px'
			borderRadius='md'
			style={{
				background: `color-mix(in srgb, ${iconColor} 14%, transparent)`,
				color: iconColor,
				border: `1px solid color-mix(in srgb, ${iconColor} 28%, transparent)`,
				boxShadow: `0 3px 8px color-mix(in srgb, ${iconColor} 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)`,
			}}
		>
			{icon}
		</Flex>
		<Box flex='1 1 auto' minW={0}>
			<Box fontSize='xs' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>{label}</Box>
			{hint && (
				<Box
					fontSize='10px'
					fontWeight='600'
					fontFamily='mono'
					letterSpacing='0.02em'
					color='fg.subtle'
					mt='0.5'
					style={{ fontVariantNumeric: 'tabular-nums' }}
				>
					{hint}
				</Box>
			)}
		</Box>
		<Box flex='0 0 auto' minW='160px'>
			{children}
		</Box>
	</Flex>
);

export default NotificationsItem;
