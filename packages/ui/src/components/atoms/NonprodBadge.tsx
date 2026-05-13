import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import React from 'react';
import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
	0% {
		background-color: color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent);
	}
	50% {
		background-color: color-mix(in srgb, var(--beak-colors-accent-alert) 60%, transparent);
	}
	100% {
		background-color: color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent);
	}
`;

const NonprodBadge: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		ipcPreferencesService.getEnvironment().then(e => setShow(e === 'nonprod'));
	}, []);

	if (!show) return null;

	return (
		<Badge onClick={() => ipcPreferencesService.switchEnvironment('prod')}>
			{'You are on the non-production environment. Swap back to production?'}
		</Badge>
	);
};

const Badge = styled.div`
	position: fixed;
	z-index: 100000;

	top: 40px; left: 0; right: 0;
	padding: 6px 0;
	font-size: 14px;
	text-align: center;
	cursor: pointer;

	background: color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent);
	animation: ${pulse} 3s infinite;
`;

export default NonprodBadge;
