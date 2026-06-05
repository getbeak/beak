import { selectAlertCounts } from '@beak/ui/store/project/selectors/alerts';
import type { AlertSeverity } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { useRef } from 'react';

import { openAlertsPanel, useAlertsPanelState } from '../lib/panel-state';
import { SEVERITY_PRESETS } from '../lib/severity';
import AlertsPanel from './AlertsPanel';

/**
 * Thin always-visible status strip pinned to the bottom of the project
 * window. Renders one pill per severity bucket that currently has alerts,
 * each clickable to open the Problems panel filtered to that severity.
 *
 * When there are no alerts the strip collapses to zero height — Beak gets
 * out of the way until something actually needs attention. As soon as the
 * first alert lands the strip slides into view (height animation), which
 * is the main "you can't miss this" cue the old action-bar triangle was
 * missing.
 */
const ORDER: AlertSeverity[] = ['error', 'warning', 'notice'];

const MotionFlex = motion.create(Flex);

const AlertStatusStrip: React.FC = () => {
	const counts = useAppSelector(selectAlertCounts);
	const panelState = useAlertsPanelState();
	const stripRef = useRef<HTMLDivElement | null>(null);
	const hasAny = counts.total > 0;

	return (
		<React.Fragment>
			<AnimatePresence initial={false}>
				{hasAny && (
					<MotionFlex
						key='alert-status-strip'
						ref={stripRef}
						role='status'
						aria-label={`${counts.total} project alert${counts.total === 1 ? '' : 's'}`}
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 26, opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 380, damping: 32 }}
						overflow='hidden'
						align='center'
						gap='1.5'
						px='3'
						borderTopWidth='1px'
						borderColor='border.subtle'
						bg='bg.surface.emphasized'
						flexShrink={0}
					>
						{ORDER.map(sev => {
							const count = counts[sev];
							if (count === 0) return null;
							return <SeverityPill key={sev} severity={sev} count={count} />;
						})}
						<Box flex='1 1 auto' />
						<Flex
							role='button'
							tabIndex={0}
							as='div'
							align='center'
							h='18px'
							px='1.5'
							borderRadius='sm'
							cursor='pointer'
							fontSize='10px'
							color='fg.muted'
							letterSpacing='0.02em'
							textTransform='uppercase'
							_hover={{ color: 'fg.default', bg: 'bg.subtle' }}
							onClick={() => openAlertsPanel(null)}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									openAlertsPanel(null);
								}
							}}
						>
							{'View all'}
						</Flex>
					</MotionFlex>
				)}
			</AnimatePresence>
			{panelState.open && <AlertsPanel anchor={stripRef.current} />}
		</React.Fragment>
	);
};

interface SeverityPillProps {
	severity: AlertSeverity;
	count: number;
}

const SeverityPill: React.FC<SeverityPillProps> = ({ severity, count }) => {
	const preset = SEVERITY_PRESETS[severity];
	const Icon = preset.icon;
	const accent = preset.accentVar;
	const label = count === 1 ? preset.label : preset.pluralLabel;

	return (
		<Flex
			role='button'
			tabIndex={0}
			align='center'
			gap='1.5'
			h='20px'
			px='2'
			borderRadius='md'
			borderWidth='1px'
			borderColor={`color-mix(in srgb, ${accent} 36%, transparent)`}
			bg={`color-mix(in srgb, ${accent} 14%, transparent)`}
			color={accent}
			fontSize='11px'
			fontWeight='600'
			letterSpacing='-0.005em'
			cursor='pointer'
			transition='background-color .12s ease, border-color .12s ease, transform .12s ease'
			_hover={{
				bg: `color-mix(in srgb, ${accent} 22%, transparent)`,
				borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
			}}
			_active={{ transform: 'translateY(1px)' }}
			aria-label={`${count} ${label.toLowerCase()}, open Problems panel`}
			onClick={() => openAlertsPanel(severity)}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					openAlertsPanel(severity);
				}
			}}
		>
			<Icon size={11} strokeWidth={2.4} />
			<Box style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</Box>
			<Box color={accent} opacity={0.85}>
				{label}
			</Box>
		</Flex>
	);
};

export default AlertStatusStrip;
