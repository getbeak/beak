import { useMemo } from 'react';
import { useSelector } from 'react-redux';

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
	const currentFlight = useSelector(s => s.global.flight.currentFlight);

	return useMemo((): FlightStatus => {
		if (!currentFlight)
			return { status: 'pending' };

		if (currentFlight.flighting)
			return { status: 'active', flightId: currentFlight.flightId };

		if (currentFlight.error)
			return { status: 'failed' };

		if (currentFlight.response) {
			return {
				status: 'complete',
				flightId: currentFlight.flightId,
				httpStatus: currentFlight.response.status,
			};
		}

		return { status: 'pending' };
	}, [
		currentFlight?.flightId,
		currentFlight?.flighting,
		currentFlight?.lastUpdate,
	]);
}
