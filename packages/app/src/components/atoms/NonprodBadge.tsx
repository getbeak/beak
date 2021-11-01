import { ipcPreferencesService } from '@beak/app/lib/ipc';
import { toHexAlpha } from '@beak/design-system/utils';
import React, { useEffect, useState } from 'react';
import styled, { DefaultTheme, keyframes } from 'styled-components';

const pulse = (theme: DefaultTheme) => keyframes`
	0% {
		background-color: ${toHexAlpha(theme.ui.destructiveAction, 1)};
	}
	50% {
		background-color: ${toHexAlpha(theme.ui.destructiveAction, 0.6)};
	}
	100% {
		background-color: ${toHexAlpha(theme.ui.destructiveAction, 1)};
	}
`;

const NonprodBadge: React.FunctionComponent = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		ipcPreferencesService.getEnvironment().then(e => setShow(e === 'nonprod'));
	}, []);

	if (!show)
		return null;

	return (
		<Badge onClick={() => ipcPreferencesService.switchEnvironment('prod')}>
			{'You are on the non-production environment. Swap back to production?'}
		</Badge>
	);
};

const Badge = styled.div`
	position: fixed;

	top: 40px; left: 0; right: 0;
	padding: 4px 0;
	text-align: center;
	cursor: pointer;

	background: ${p => toHexAlpha(p.theme.ui.destructiveAction, 1)};
	animation: ${p => pulse(p.theme)} 3s infinite;
`;

export default NonprodBadge;
