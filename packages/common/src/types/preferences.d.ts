export type NotificationState = 'on' | 'on-no-sound' | 'sound-only' | 'off';

export interface NotificationPreferences {
	onSuccessfulRequest: NotificationState;
	onInformationRequest: NotificationState;
	onFailedRequest: NotificationState;
	showRequestNotificationWhenFocused: boolean;

	onUpdateAvailable: NotificationState;
}
