import { Box, Flex } from '@chakra-ui/react';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const NonprodBadge: React.FC = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		ipcPreferencesService.getEnvironment().then(e => setShow(e === 'nonprod'));
	}, []);

	if (!show) return null;

	return (
		<Flex
			position='fixed'
			zIndex={100000}
			top='3'
			left='50%'
			align='center'
			gap='2'
			px='3'
			py='1.5'
			borderRadius='full'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 60%, transparent)'
			bg='color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)'
			backdropFilter='blur(14px) saturate(160%)'
			boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-alert) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
			color='accent.alert'
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.06em'
			textTransform='uppercase'
			cursor='pointer'
			transform='translateX(-50%)'
			animation='beakNonprodPulse 2.4s ease-in-out infinite'
			transition='filter .14s ease, transform .08s ease'
			_hover={{ filter: 'brightness(1.08)' }}
			_active={{ transform: 'translateX(-50%) scale(0.97)' }}
			css={{
				'@keyframes beakNonprodPulse': {
					'0%, 100%': {
						boxShadow: '0 8px 24px color-mix(in srgb, var(--beak-colors-accent-alert) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)',
					},
					'50%': {
						boxShadow: '0 8px 30px color-mix(in srgb, var(--beak-colors-accent-alert) 60%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
					},
				},
			}}
			onClick={() => ipcPreferencesService.switchEnvironment('prod')}
		>
			<AlertTriangle size={11} strokeWidth={2.2} />
			<Box as='span'>{'Non-prod env'}</Box>
			<Box as='span' opacity={0.7} fontWeight='500' textTransform='none' letterSpacing='0'>
				{'tap to swap back'}
			</Box>
		</Flex>
	);
};

export default NonprodBadge;
