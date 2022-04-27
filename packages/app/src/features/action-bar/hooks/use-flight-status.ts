import { useMemo } from 'react';
import { useAppSelector } from '@beak/app/store/redux';

interface PendingFlightStatus { status: 'pending' }
interface ActiveFlightStatus { status: 'active'; flightId: string }
interface FailedFlightStatus { status: 'failed' }
interface CompleteFlightStatus {
	status: 'complete';
	flightId: string;
	httpStatus: number;
}

type FlightStatus = PendingFlightStatus | ActiveFlightStatus | FailedFlightStatus | CompleteFlightStatus;

export default function useFlightStatus(): FlightStatus {
	const { currentFlight, latestFlight } = useAppSelector(s => s.global.flight);

	return useMemo((): FlightStatus => {
		if (currentFlight && currentFlight.flighting)
			return { status: 'active', flightId: currentFlight.flightId };

		if (latestFlight) {
			if (latestFlight.error)
				return { status: 'failed' };

			if (latestFlight.response) {
				return {
					status: 'complete',
					flightId: latestFlight.flightId,
					httpStatus: latestFlight.response.status,
				};
			}
		}

		return { status: 'pending' };
	}, [
		currentFlight?.flightId,
		currentFlight?.flighting,
		currentFlight?.lastUpdate,
		latestFlight?.flightId,
		latestFlight?.flighting,
		latestFlight?.lastUpdate,
	]);
}
