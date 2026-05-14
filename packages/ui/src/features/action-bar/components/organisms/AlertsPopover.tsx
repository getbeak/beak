import { Box, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import AlertSwitch from './AlertSwitch';

interface AlertsPopoverProps {
	parent: HTMLButtonElement;
	onClose: () => void;
}

const AlertsPopover: React.FC<AlertsPopoverProps> = ({ parent, onClose }) => {
	const alerts = useAppSelector(s => s.global.project.alerts);
	const hasAlerts = TypedObject.values(alerts).filter(Boolean).length > 0;
	const boundingRect = parent.getBoundingClientRect();

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onClose]);

	return createPortal(
		<Box position='fixed' inset='0' onClick={() => onClose()}>
			<Box
				position='fixed'
				w='320px'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 24%, var(--beak-colors-border-subtle))'
				borderRadius='xl'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
				backdropFilter='blur(24px) saturate(180%)'
				boxShadow='0 40px 96px rgba(0,0,0,0.38), 0 12px 32px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, rgba(0,0,0,0.18)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
				overflow='hidden'
				zIndex={101}
				style={{
					marginTop: `${boundingRect.top + parent.clientHeight + 6}px`,
					marginLeft: `${boundingRect.left - 320 + 30}px`,
				}}
				css={{
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '64px',
						background: 'radial-gradient(80% 100% at 50% 0%, color-mix(in srgb, var(--beak-colors-accent-pink) 24%, transparent), transparent 70%)',
						pointerEvents: 'none',
						zIndex: 0,
					},
					'& > *': { position: 'relative', zIndex: 1 },
				}}
				onClick={event => event.stopPropagation()}
			>
				{!hasAlerts && (
					<Flex direction='column' align='center' gap='2' px='4' py='6' textAlign='center'>
						<Flex
							align='center'
							justify='center'
							w='40px'
							h='40px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 28%, transparent)'
							color='accent.teal'
							boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-teal) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
						>
							<CheckCircle2 size={18} strokeWidth={2} />
						</Flex>
						<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
							{'You have no alerts'}
						</Box>
						<Box
							fontSize='10px'
							fontWeight='700'
							letterSpacing='0.06em'
							textTransform='uppercase'
							color='accent.teal'
						>
							{'Everything in this project looks healthy'}
						</Box>
					</Flex>
				)}
				{hasAlerts &&
					TypedObject.values(alerts)
						.filter(Boolean)
						.map(alert => <AlertSwitch key={alert!.type} alert={alert!} />)}
			</Box>
		</Box>,
		document.getElementById('action-alerts-popover')!,
	);
};

export default AlertsPopover;
