import { useAppSelector } from '@beak/ui/store/redux';
import { useMemo } from 'react';

interface PendingFlightStatus {
	status: 'pending';
}
interface ActiveFlightStatus {
	status: 'active';
	flightId: string;
}
interface FailedFlightStatus {
	status: 'failed';
}
interface CompleteFlightStatus {
	status: 'complete';
	flightId: string;
	httpStatus: number;
}

type FlightStatus = PendingFlightStatus | ActiveFlightStatus | FailedFlightStatus | CompleteFlightStatus;

export default function useFlightStatus(): FlightStatus {
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const activeFlight = useAppSelector(s => (selectedTab ? s.global.flight.activeFlights[selectedTab] : undefined));
	const flightState = useAppSelector(s => (selectedTab ? s.global.flight.flightStates[selectedTab] : undefined));

	return useMemo((): FlightStatus => {
		if (activeFlight) return { status: 'active', flightId: activeFlight.flightId };

		if (flightState?.status === 'failed') return { status: 'failed' };

		if (flightState?.status === 'completed') {
			return {
				status: 'complete',
				flightId: flightState.result.flightId,
				httpStatus: flightState.result.response?.status ?? 200,
			};
		}

		return { status: 'pending' };
	}, [activeFlight?.flightId, flightState]);
}
