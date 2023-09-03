import React from 'react';
import { Select } from '@beak/ui/components/atoms/Input';
import { NotificationState } from '@beak/common/types/preferences';

interface NotificationStateSelectProps {
	value: NotificationState;
	onChange: (state: NotificationState) => void;
}

const NotificationStateSelect: React.FC<NotificationStateSelectProps> = ({ value, onChange }) => (
	<Select
		beakSize={'sm'}
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
