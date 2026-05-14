import { Box, Flex } from '@chakra-ui/react';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const NonprodBadge: React.FC = () => {
	const reduced = useReducedMotion();
	const [show, setShow] = useState(false);

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getEnvironment().then(e => {
			if (!cancelled) setShow(e === 'nonprod');
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!show) return null;

	return (
		<Flex
			role='button'
			tabIndex={0}
			aria-label='Currently in non-production environment, click to switch back to production'
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
			animation={reduced ? undefined : 'beakNonprodPulse 2.4s ease-in-out infinite'}
			transition='filter .14s ease, transform .08s ease'
			_hover={{ filter: 'brightness(1.08)' }}
			_focusVisible={{
				outline: 'none',
				boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-alert) 45%, transparent)',
			}}
			_active={{ transform: 'translateX(-50%) scale(0.97)' }}
			onClick={() => ipcPreferencesService.switchEnvironment('prod')}
			onKeyDown={event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					ipcPreferencesService.switchEnvironment('prod');
				}
			}}
		>
			<AlertTriangle size={11} strokeWidth={2.2} />
			<Box as='span'>{'Non-prod env'}</Box>
			<Box
				as='span'
				w='1px'
				h='10px'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 45%, transparent)'
				display='inline-block'
				mx='-0.5'
			/>
			<Box
				as='span'
				color='color-mix(in srgb, var(--beak-colors-accent-alert) 80%, var(--beak-colors-fg-default))'
				fontWeight='500'
				textTransform='none'
				letterSpacing='0'
			>
				{'tap to swap back'}
			</Box>
		</Flex>
	);
};

export default NonprodBadge;
