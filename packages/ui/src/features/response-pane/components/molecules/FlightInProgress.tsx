import { Box, Flex } from '@chakra-ui/react';
import type { FlightInProgress as FlightInProgressType } from '@beak/state/flight';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const MotionFlex = motion.create(Flex);
const MotionBox = motion.create(Box);

/**
 * Two-mode overlay tied to the in-progress flight:
 *
 *  - Pre-head: full-pane translucent splash with the spinning beak — there's
 *    nothing meaningful to show yet, so we own the surface.
 *  - Post-head: collapsed to a slim top-of-pane progress strip showing bytes
 *    transferred (or SSE event count). The Inspector renders behind it with
 *    headers and a live-updating body.
 */
const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const reduced = useReducedMotion();
	const active = Boolean(currentFlight && currentFlight.requestId === requestId);
	const hasHead = Boolean(active && currentFlight?.head);
	const showSplash = active && !hasHead;
	const showStreamingBar = active && hasHead;

	return (
		<>
			<AnimatePresence>
				{showSplash && (
					<MotionFlex
						role='status'
						aria-live='polite'
						aria-label='Sending request'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						position='absolute'
						inset='0'
						align='center'
						justify='center'
						pointerEvents='none'
						textAlign='center'
						zIndex={3}
						css={{
							background:
								'color-mix(in srgb, var(--beak-colors-bg-canvas) 58%, transparent)',
							backdropFilter: 'blur(14px) saturate(160%)',
						}}
					>
					<Flex direction='column' align='center' gap='4'>
						<Box position='relative' w='80px' h='80px'>
							{!reduced && (
								<>
									<Box
										position='absolute'
										inset='0'
										borderRadius='full'
										bg='color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)'
										animation='beakFlightOuter 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
									/>
									<Box
										position='absolute'
										inset='0'
										borderRadius='full'
										bg='color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent)'
										animation='beakFlightInner 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.4s infinite'
									/>
								</>
							)}
							<MotionBox
								position='absolute'
								inset='0'
								borderRadius='full'
								bg='bg.surface'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 55%, var(--beak-colors-border-subtle))'
								boxShadow='0 10px 28px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, rgba(0,0,0,0.2)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
								animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
								transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
								css={{
									backgroundImage: "url('images/logo.svg')",
									backgroundSize: '36px',
									backgroundPosition: 'center',
									backgroundRepeat: 'no-repeat',
								}}
							/>
						</Box>
						<Flex direction='column' align='center' gap='1'>
							<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
								{'Sending request…'}
							</Box>
							<Box fontSize='10px' color='accent.pink' letterSpacing='0.08em' textTransform='uppercase' fontWeight='700'>
								{'Awaiting response'}
							</Box>
						</Flex>
					</Flex>
				</MotionFlex>
			)}
		</AnimatePresence>

			<AnimatePresence>
				{showStreamingBar && currentFlight && <StreamingStatusBar flight={currentFlight} />}
			</AnimatePresence>
		</>
	);
};

const StreamingStatusBar: React.FC<{ flight: FlightInProgressType }> = ({ flight }) => {
	const head = flight.head!;
	const transferred = flight.bodyTransferred ?? 0;
	const total = head.contentLength;
	const pct = total > 0 ? Math.min(100, (transferred / total) * 100) : null;
	const isSse = head.streamKind === 'sse';
	const sseCount = flight.sseEvents?.length ?? 0;

	const label = isSse
		? `Streaming · ${sseCount} event${sseCount === 1 ? '' : 's'} · ${formatBytes(transferred)}`
		: pct !== null
			? `Streaming · ${formatBytes(transferred)} / ${formatBytes(total)}`
			: `Streaming · ${formatBytes(transferred)}`;

	return (
		<MotionFlex
			role='status'
			aria-live='polite'
			aria-label={`Streaming response — ${label}`}
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -4 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
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
			<Box w='6px' h='6px' borderRadius='full' bg='accent.pink' animation='beakFlightInner 1.2s ease-in-out infinite' />
			<Box>{label}</Box>
			{pct !== null && (
				<Box flexGrow={1} h='2px' borderRadius='full' bg='color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)' overflow='hidden'>
					<Box h='100%' w={`${pct}%`} bg='accent.pink' transition='width 80ms linear' />
				</Box>
			)}
		</MotionFlex>
	);
};

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default FlightInProgress;
