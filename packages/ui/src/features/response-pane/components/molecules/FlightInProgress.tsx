import type { FlightInProgress as FlightInProgressType } from '@beak/state/flight';
import { Box, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const MotionFlex = motion.create(Flex);

/**
 * Slim top-of-pane progress strip. Stays out of the body so any previous
 * response keeps rendering behind it — re-firing a request never blanks the
 * pane. Pre-head shows "Sending…" with a soft pulse; post-head shows live
 * bytes / SSE count + a thin progress bar when content-length is known.
 */
const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const reduced = useReducedMotion();
	const active = Boolean(currentFlight && currentFlight.requestId === requestId);
	if (!active || !currentFlight) {
		return (
			<AnimatePresence>
				{/* AnimatePresence wraps nothing on the inactive path so the bar's
				    exit transition still plays when the flight wraps up. */}
			</AnimatePresence>
		);
	}

	const head = currentFlight.head;
	const hasHead = Boolean(head);
	const transferred = currentFlight.bodyTransferred ?? 0;
	const total = head?.contentLength ?? 0;
	const pct = hasHead && total > 0 ? Math.min(100, (transferred / total) * 100) : null;
	const isSse = head?.streamKind === 'sse';
	const sseCount = currentFlight.sseEvents?.length ?? 0;

	const label = !hasHead
		? 'Sending request…'
		: isSse
			? `Streaming · ${sseCount} event${sseCount === 1 ? '' : 's'} · ${formatBytes(transferred)}`
			: pct !== null
				? `Streaming · ${formatBytes(transferred)} / ${formatBytes(total)}`
				: `Streaming · ${formatBytes(transferred)}`;

	return (
		<AnimatePresence>
			<MotionFlex
				key='flight-status'
				role='status'
				aria-live='polite'
				aria-label={`Flight in progress — ${label}`}
				initial={{ opacity: 0, y: -4 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -4 }}
				transition={{ duration: 0.12, ease: 'easeOut' }}
				position='absolute'
				top='0'
				left='0'
				right='0'
				zIndex={3}
				pointerEvents='none'
				align='center'
				gap='2'
				px='3'
				py='1'
				fontSize='10px'
				fontWeight='600'
				letterSpacing='0.04em'
				textTransform='uppercase'
				color='accent.pink'
				css={{
					background: 'color-mix(in srgb, var(--beak-colors-bg-canvas) 70%, transparent)',
					backdropFilter: 'blur(10px)',
					borderBottom: '1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
				}}
			>
				<Box
					w='6px'
					h='6px'
					borderRadius='full'
					bg='accent.pink'
					css={
						reduced
							? undefined
							: {
									animation: 'beakFlightPulse 1.4s ease-in-out infinite',
									'@keyframes beakFlightPulse': {
										'0%, 100%': { opacity: 0.4, transform: 'scale(0.8)' },
										'50%': { opacity: 1, transform: 'scale(1.15)' },
									},
								}
					}
				/>
				<Box>{label}</Box>
				{pct !== null && (
					<Box
						flexGrow={1}
						h='2px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)'
						overflow='hidden'
					>
						<Box h='100%' w={`${pct}%`} bg='accent.pink' transition='width 80ms linear' />
					</Box>
				)}
			</MotionFlex>
		</AnimatePresence>
	);
};

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default FlightInProgress;
