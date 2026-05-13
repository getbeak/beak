import { Box } from '@chakra-ui/react';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import * as React from 'react';
import { useEffect, useState } from 'react';

const NonprodBadge: React.FC = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		ipcPreferencesService.getEnvironment().then(e => setShow(e === 'nonprod'));
	}, []);

	if (!show) return null;

	return (
		<Box
			position='fixed'
			zIndex={100000}
			top='10'
			left='0'
			right='0'
			py='1.5'
			fontSize='lg'
			textAlign='center'
			cursor='pointer'
			bg='color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent)'
			animation='beakNonprodPulse 3s infinite'
			css={{
				'@keyframes beakNonprodPulse': {
					'0%': {
						backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent)',
					},
					'50%': {
						backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-alert) 60%, transparent)',
					},
					'100%': {
						backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-alert) 100%, transparent)',
					},
				},
			}}
			onClick={() => ipcPreferencesService.switchEnvironment('prod')}
		>
			{'You are on the non-production environment. Swap back to production?'}
		</Box>
	);
};

export default NonprodBadge;
