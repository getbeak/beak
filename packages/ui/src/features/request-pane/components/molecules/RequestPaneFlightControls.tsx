import { selectActiveFlightsForRequest } from '@beak/state/flight';
import { statusToColor } from '@beak/design-system/helpers';
import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import {
	useNavigateFlightHistoryForSelectedTab,
	useSelectedTabFlightRequirements,
	useSelectedTabFlightStatus,
} from '@beak/ui/services/flight/tab-integration';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex, Popover, Portal, chakra } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CircleCheck, CircleDot, CircleX, Loader2 } from 'lucide-react';
import * as React from 'react';

interface RequestPaneFlightControlsProps {
	requestId: string;
}

const ChakraButton = chakra('button');

/**
 * Per-request flight status + history navigation. Lives at the leading edge
 * of the request pane's header row (next to the verb/URL chassis) because
 * the flight belongs to the request, not the window.
 *
 * The status pill is hoverable — a popover lists every active flight for
 * this request (multiple flights per request is the default now, so the
 * single-dot indicator wasn't telling the whole story).
 */
const RequestPaneFlightControls: React.FC<RequestPaneFlightControlsProps> = ({ requestId }) => {
	const status = useSelectedTabFlightStatus();
	const requirements = useSelectedTabFlightRequirements();
	const { goToNext, goToPrevious } = useNavigateFlightHistoryForSelectedTab();
	const activeFlights = useAppSelector(selectActiveFlightsForRequest(requestId));

	return (
		<Flex
			align='center'
			gap='0.5'
			h='26px'
			px='0.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-canvas) 50%, transparent)'
			flexShrink={0}
		>
			<BeakTooltip content='Previous flight in history'>
				<ArrowButton
					aria-label='Previous flight in history'
					disabled={!requirements?.canGoBack}
					onClick={goToPrevious}
				>
					<ChevronLeft size={13} />
				</ArrowButton>
			</BeakTooltip>

			<Popover.Root>
				<Popover.Trigger asChild>
					<ChakraButton
						type='button'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						w='22px'
						h='22px'
						border='none'
						borderRadius='sm'
						bg='transparent'
						cursor='pointer'
						color='fg.default'
						transition='background-color .1s linear'
						_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
					>
						<StatusIcon status={status} />
					</ChakraButton>
				</Popover.Trigger>
				<Portal>
					<Popover.Positioner>
						<Popover.Content
							bg='bg.surface.emphasized'
							borderWidth='1px'
							borderColor='border.default'
							borderRadius='md'
							boxShadow='0 12px 32px rgba(0,0,0,0.32)'
							p='2'
							minW='260px'
						>
							<Popover.Body p='0'>
								<FlightStatusPopoverBody
									status={status}
									activeFlights={activeFlights}
									totalHistory={requirements?.totalFlights ?? 0}
								/>
							</Popover.Body>
						</Popover.Content>
					</Popover.Positioner>
				</Portal>
			</Popover.Root>

			<BeakTooltip content='Next flight in history'>
				<ArrowButton
					aria-label='Next flight in history'
					disabled={!requirements?.canGoForward}
					onClick={goToNext}
				>
					<ChevronRight size={13} />
				</ArrowButton>
			</BeakTooltip>
		</Flex>
	);
};

const ArrowButton: React.FC<
	React.PropsWithChildren<{
		'aria-label': string;
		disabled?: boolean;
		onClick: () => void;
	}>
> = ({ children, disabled, onClick, ...rest }) => (
	<ChakraButton
		type='button'
		{...rest}
		disabled={disabled}
		onClick={onClick}
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		w='22px'
		h='22px'
		border='none'
		borderRadius='sm'
		bg='transparent'
		cursor={disabled ? 'default' : 'pointer'}
		color={disabled ? 'fg.disabled' : 'fg.muted'}
		transition='color .1s linear, background-color .1s linear'
		_hover={disabled ? undefined : { color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
	>
		{children}
	</ChakraButton>
);

const StatusIcon: React.FC<{ status: ReturnType<typeof useSelectedTabFlightStatus> }> = ({ status }) => {
	return (
		<AnimatePresence mode='wait'>
			{(() => {
				switch (status.status) {
					case 'active':
						return (
							<motion.div
								key='active'
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.12 }}
								style={{ display: 'inline-flex', color: 'var(--beak-colors-accent-pink)' }}
							>
								<Loader2 tabIndex={-1} size={14} style={{ animation: 'beakSpin 1s linear infinite' }} />
							</motion.div>
						);
					case 'complete': {
						const failure = status.httpStatus > 399;
						const statusColor = statusToColor(status.httpStatus);
						const Icon = failure ? CircleX : CircleCheck;
						return (
							<motion.div
								key={`complete-${status.httpStatus}`}
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.14 }}
								style={{ display: 'inline-flex' }}
							>
								<Icon color={statusColor} tabIndex={-1} size={14} />
							</motion.div>
						);
					}
					case 'failed':
						return (
							<motion.div
								key='failed'
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.14 }}
								style={{ display: 'inline-flex' }}
							>
								<CircleX color='var(--beak-colors-accent-alert)' tabIndex={-1} size={14} />
							</motion.div>
						);
					default:
						return (
							<motion.div
								key='pending'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.12 }}
								style={{ display: 'inline-flex', color: 'var(--beak-colors-fg-muted)' }}
							>
								<CircleDot tabIndex={-1} size={14} />
							</motion.div>
						);
				}
			})()}
		</AnimatePresence>
	);
};

interface PopoverBodyProps {
	status: ReturnType<typeof useSelectedTabFlightStatus>;
	activeFlights: ReturnType<typeof selectActiveFlightsForRequest> extends (s: never) => infer R ? R : never;
	totalHistory: number;
}

const FlightStatusPopoverBody: React.FC<PopoverBodyProps> = ({ status, activeFlights, totalHistory }) => {
	const headline =
		status.status === 'active'
			? 'Flight in progress'
			: status.status === 'complete'
				? `Last flight ${status.httpStatus}`
				: status.status === 'failed'
					? 'Last flight failed'
					: 'No flights yet';
	return (
		<Flex direction='column' gap='2'>
			<Flex direction='column' gap='0.5'>
				<Box fontSize='11px' fontWeight='700' letterSpacing='0.04em' textTransform='uppercase' color='fg.subtle'>
					{'Status'}
				</Box>
				<Box fontSize='13px' fontWeight='600' color='fg.default'>
					{headline}
				</Box>
				<Box fontSize='11px' color='fg.subtle'>
					{`${totalHistory} flight${totalHistory === 1 ? '' : 's'} in history`}
				</Box>
			</Flex>
			{activeFlights.length > 0 && (
				<Flex direction='column' gap='1' borderTopWidth='1px' borderColor='border.subtle' pt='2'>
					<Box fontSize='11px' fontWeight='700' letterSpacing='0.04em' textTransform='uppercase' color='fg.subtle'>
						{`Active · ${activeFlights.length}`}
					</Box>
					{activeFlights.map(flight => (
						<Flex key={flight.flightId} align='center' gap='2' fontSize='12px' color='fg.muted'>
							<Box w='6px' h='6px' borderRadius='full' bg='accent.pink' flexShrink={0} />
							<Box flex='1' minW={0} fontFamily='mono' fontSize='11px' truncate>
								{flight.flightId}
							</Box>
							<Box flexShrink={0} fontVariantNumeric='tabular-nums' color='fg.subtle'>
								{flight.head ? `${flight.bodyTransferred ?? 0} B` : 'sending'}
							</Box>
						</Flex>
					))}
				</Flex>
			)}
		</Flex>
	);
};

export default RequestPaneFlightControls;
