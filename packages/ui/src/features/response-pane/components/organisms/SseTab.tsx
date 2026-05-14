import { Box, Flex } from '@chakra-ui/react';
import { type SseEvent } from '@beak/state/flight';
import { useAppSelector } from '@beak/ui/store/redux';
import type { Flight } from '@getbeak/types/flight';
import React from 'react';

export interface SseTabProps {
	flight: Flight;
}

/**
 * Live event log for `text/event-stream` responses. Pulls events from either
 * the in-progress flight (live) or the completed history entry (post-mortem).
 * Renders newest at the bottom and pins the scrollbar to the tail unless the
 * user has scrolled away.
 */
const SseTab: React.FC<SseTabProps> = ({ flight }) => {
	const events = useSseEvents(flight.requestId, flight.flightId);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const pinnedToBottomRef = React.useRef(true);

	React.useEffect(() => {
		const el = containerRef.current;
		if (!el || !pinnedToBottomRef.current) return;
		el.scrollTop = el.scrollHeight;
	}, [events.length]);

	function handleScroll(e: React.UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		pinnedToBottomRef.current = distanceFromBottom < 8;
	}

	if (events.length === 0) {
		return (
			<Flex h='100%' align='center' justify='center' color='fg.muted' fontSize='sm'>
				{'Waiting for events…'}
			</Flex>
		);
	}

	return (
		<Flex direction='column' h='100%'>
			<Flex
				px='3'
				py='1.5'
				align='center'
				justify='space-between'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				fontSize='10px'
				fontWeight='600'
				letterSpacing='0.04em'
				textTransform='uppercase'
				color='fg.muted'
			>
				<Box>{`${events.length} event${events.length === 1 ? '' : 's'}`}</Box>
				<Box color='accent.pink'>{'live'}</Box>
			</Flex>
			<Box ref={containerRef} flex='1' overflowY='auto' onScroll={handleScroll}>
				{events.map((event, idx) => (
					<EventRow key={`${event.receivedAt}-${idx}`} event={event} index={idx} />
				))}
			</Box>
		</Flex>
	);
};

const EventRow: React.FC<{ event: SseEvent; index: number }> = ({ event, index }) => {
	const time = new Date(event.receivedAt).toISOString().slice(11, 23);
	const eventName = event.event ?? 'message';

	return (
		<Flex
			direction='column'
			gap='1'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			fontFamily='mono'
			fontSize='xs'
			_hover={{ bg: 'bg.subtle' }}
		>
			<Flex align='center' gap='2' fontSize='10px' color='fg.muted'>
				<Box w='3ch' textAlign='right'>{`#${index + 1}`}</Box>
				<Box>{time}</Box>
				<Box
					px='1.5'
					py='0'
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					color='accent.pink'
					fontWeight='600'
					textTransform='uppercase'
					letterSpacing='0.03em'
				>
					{eventName}
				</Box>
				{event.id !== undefined && (
					<Box color='fg.subtle'>{`id: ${event.id}`}</Box>
				)}
				{event.retry !== undefined && (
					<Box color='fg.subtle'>{`retry: ${event.retry}ms`}</Box>
				)}
			</Flex>
			<Box
				as='pre'
				whiteSpace='pre-wrap'
				wordBreak='break-word'
				color='fg.default'
				m='0'
			>
				{event.data || <Box as='span' color='fg.disabled'>{'(empty)'}</Box>}
			</Box>
		</Flex>
	);
};

/**
 * Pull SSE events for a given flight from either the live active flight or the
 * post-completion history entry — whichever has them. Returns an empty array
 * if neither does.
 */
function useSseEvents(requestId: string, flightId: string): SseEvent[] {
	return useAppSelector(s => {
		const live = s.global.flight.activeFlights[flightId]?.sseEvents;
		if (live) return live;
		const historic = s.global.flight.flightHistories[requestId]?.history[flightId]?.sseEvents;
		return historic ?? [];
	});
}

export default SseTab;
