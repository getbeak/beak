import { glassChakraProps } from '@beak/ui/lib/glass';
import { Box, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { openAlertsPanel } from '../lib/panel-state';
import { SEVERITY_PRESETS } from '../lib/severity';
import { dismissToast, useToastQueue } from '../lib/toast-queue';
import SeverityIcon from './atoms/SeverityIcon';

const MotionFlex = motion.create(Flex);

/**
 * Stack of transient error toasts pinned to the bottom-right corner. Sits
 * above the status strip vertically so it doesn't fight with the rest of
 * the chrome. Each toast auto-dismisses after a few seconds, but clicking
 * the body opens the Problems panel filtered to that severity — and the X
 * dismisses just that one.
 *
 * Toasts are appended *only* for error-severity alerts. Warnings and
 * notices already live in the strip + row flair and don't need to steal
 * focus.
 */
const AlertToaster: React.FC = () => {
	const toasts = useToastQueue();
	if (typeof document === 'undefined') return null;
	return createPortal(
		<Box
			position='fixed'
			bottom='12px'
			right='12px'
			zIndex={9000}
			pointerEvents='none'
			display='flex'
			flexDirection='column'
			alignItems='flex-end'
			gap='1.5'
			maxW='380px'
		>
			<AnimatePresence initial={false}>
				{toasts.map(toast => {
					const preset = SEVERITY_PRESETS[toast.severity];
					const accent = preset.accentVar;
					return (
						<MotionFlex
							key={toast.id}
							role='status'
							layout
							initial={{ opacity: 0, y: 20, scale: 0.96 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
							transition={{ type: 'spring', stiffness: 360, damping: 32 }}
							align='flex-start'
							gap='2.5'
							p='2.5'
							pr='2'
							borderRadius='md'
							borderWidth='1px'
							borderColor={`color-mix(in srgb, ${accent} 40%, transparent)`}
							bg={glassChakraProps.toast.bg}
							backdropFilter={glassChakraProps.toast.backdropFilter}
							boxShadow={`${glassChakraProps.toast.boxShadow}, 0 16px 36px -8px color-mix(in srgb, ${accent} 28%, transparent), 0 0 0 1px color-mix(in srgb, ${accent} 14%, transparent)`}
							minW='280px'
							maxW='380px'
							style={{ pointerEvents: 'auto', WebkitBackdropFilter: glassChakraProps.toast.backdropFilter }}
							onClick={() => openAlertsPanel(toast.severity)}
							cursor='pointer'
						>
							<SeverityIcon severity={toast.severity} size={12} />
							<Box flex='1 1 auto' minW={0}>
								<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em' lineHeight='1.3'>
									{toast.title}
								</Box>
								<Box fontSize='xs' color='fg.muted' lineHeight='1.45' mt='0.5'>
									{toast.description}
								</Box>
							</Box>
							<Flex
								role='button'
								tabIndex={0}
								as='div'
								align='center'
								justify='center'
								w='20px'
								h='20px'
								borderRadius='sm'
								color='fg.muted'
								cursor='pointer'
								_hover={{ color: 'fg.default', bg: 'bg.subtle' }}
								onClick={e => {
									e.stopPropagation();
									dismissToast(toast.id);
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										e.stopPropagation();
										dismissToast(toast.id);
									}
								}}
								aria-label='Dismiss notification'
							>
								<X size={11} strokeWidth={2.4} />
							</Flex>
						</MotionFlex>
					);
				})}
			</AnimatePresence>
		</Box>,
		document.body,
	);
};

export default AlertToaster;
