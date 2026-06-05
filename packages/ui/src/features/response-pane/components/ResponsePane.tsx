import { type FlightInProgress as FlightInProgressType, selectActiveFlight } from '@beak/state/flight';
import PendingSlash from '@beak/ui/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/ui/store/redux';
import { Flex } from '@chakra-ui/react';
import type { Flight } from '@getbeak/types/flight';
import * as React from 'react';

import FlightInProgress from './molecules/FlightInProgress';
import Header from './molecules/Header';
import Inspector from './organisms/Inspector';
import SocketPanel, { useSocketForRequest } from './organisms/SocketPanel';

const ResponsePane: React.FC = () => {
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useAppSelector(s => s.global.flight.flightHistories);
	const currentFlight = useAppSelector(s => (selectedTab ? selectActiveFlight(selectedTab)(s) : null)) ?? undefined;
	const selectedNode = tree![selectedTab!];
	const flightHistory = flightHistories[selectedTab!];
	const selectedFlight =
		flightHistory?.selected !== undefined ? flightHistory.history[flightHistory.selected] : undefined;

	// Prefer the live, in-progress flight once its head has landed — that lets the
	// Inspector render status, headers, and a streaming body before `complete`
	// fires (essential for SSE, long bodies, ranged downloads). Until then we
	// fall back to the most recent completed flight in history, if any.
	const liveFlight = React.useMemo(
		() => (currentFlight?.head ? synthesizeFlight(currentFlight) : null),
		[currentFlight],
	);
	const displayedFlight = liveFlight ?? selectedFlight;
	const socketSession = useSocketForRequest(selectedTab ?? undefined);

	// When a socket exists for this request, take over the response pane —
	// the HTTP inspector is irrelevant and the socket panel owns the
	// connection lifecycle, message log, and send box.
	const showSocket = Boolean(selectedNode && socketSession);
	const pending = !selectedNode || (!displayedFlight && !showSocket);

	return (
		<Flex
			position='relative'
			direction='column'
			bg='bg.surface'
			h='100%'
			w='100%'
			css={{
				'&::before': {
					content: '""',
					position: 'absolute',
					top: '8%',
					bottom: '8%',
					left: 0,
					width: '1px',
					background:
						'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--beak-colors-border-default) 65%, transparent) 8%, color-mix(in srgb, var(--beak-colors-border-default) 65%, transparent) 92%, transparent)',
					pointerEvents: 'none',
					zIndex: 1,
				},
			}}
		>
			{pending && <PendingSlash />}
			{showSocket && socketSession && <SocketPanel session={socketSession} />}
			{!showSocket && !pending && displayedFlight && (
				<React.Fragment>
					<Header selectedFlight={displayedFlight} />
					<Inspector flight={displayedFlight} />
				</React.Fragment>
			)}

			{!showSocket && <FlightInProgress requestId={selectedTab!} currentFlight={currentFlight} />}
		</Flex>
	);
};

/**
 * Build a {@link Flight}-shape from a live {@link FlightInProgress} so the Inspector
 * can render before the body completes. Mirrors what the slice would persist on
 * `completeFlight`; the difference is `hasBody` is `true` once any bytes have
 * arrived (not just when content-length was advertised), which keeps the raw
 * viewer accurate during streaming.
 */
function synthesizeFlight(f: FlightInProgressType): Flight {
	const head = f.head!;
	const transferred = f.bodyTransferred ?? 0;
	return {
		requestId: f.requestId,
		flightId: f.flightId,
		request: f.request as unknown as Flight['request'],
		response: {
			headers: head.headers,
			redirected: head.redirected,
			status: head.status,
			url: head.url,
			hasBody: head.contentLength > 0 || transferred > 0,
		},
		binaryStoreKey: f.binaryStoreKey,
		timing: f.timing,
	};
}

export default ResponsePane;
