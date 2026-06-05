import type { NotificationState } from '@beak/common/types/preferences';
import { Select } from '@beak/ui/components/atoms/Input';
import React from 'react';

interface NotificationStateSelectProps {
	value: NotificationState;
	onChange: (state: NotificationState) => void;
	/** Names what kind of request this select governs, for screen readers. */
	label?: string;
}

const NotificationStateSelect: React.FC<NotificationStateSelectProps> = ({ value, onChange, label }) => (
	<Select
		$beakSize={'sm'}
		aria-label={label ? `${label} — notification style` : 'Notification style'}
		value={value}
		onChange={e => onChange(e.currentTarget.value as NotificationState)}
	>
		<option value={'on'}>{'Banner, with sound'}</option>
		<option value={'on-no-sound'}>{'Banner, without sound'}</option>
		<option value={'sound-only'}>{'Sound only'}</option>
		<option value={'off'}>{'Off'}</option>
	</Select>
);

export default NotificationStateSelect;
