import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import { TriangleAlert } from 'lucide-react';

import React, { useRef, useState } from 'react';

import ActionBarButton from '../atoms/ActionBarButton';
import AlertsPopover from '../organisms/AlertsPopover';

interface ActionBarAlertButtonProps {
	id: string;
}

const ActionBarAlertButton: React.FC<ActionBarAlertButtonProps> = ({ id }) => {
	const [showPopover, setShowPopover] = useState(false);
	const alerts = useAppSelector(s => s.global.project.alerts);
	const hasAlerts = TypedObject.values(alerts).filter(Boolean).length > 0;
	const parentRef = useRef<HTMLButtonElement | null>(null);

	if (!hasAlerts) return null;

	return (
		<React.Fragment>
			<ActionBarButton id={id} ref={parentRef} onClick={() => setShowPopover(true)}>
				<TriangleAlert color={hasAlerts ? 'orange' : 'var(--beak-colors-fg-muted)'} />
			</ActionBarButton>

			{parentRef.current && showPopover && (
				<AlertsPopover parent={parentRef.current} onClose={() => setShowPopover(false)} />
			)}
		</React.Fragment>
	);
};

export default ActionBarAlertButton;
