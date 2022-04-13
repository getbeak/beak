import { useMemo } from 'react';
import { Flight } from '@beak/app/store/flight/types';

// This is shit
// Use: mime.extension

export default function useDetectedFlightFormat(flight: Flight, mode: 'request' | 'response') {
	return useMemo(() => {
		if (mode === 'request') {
			const contentTypeKey = Object
				.keys(flight.request.headers)
				.find(k => flight.request.headers[k].name.toLowerCase() === 'content-type');

			if (!contentTypeKey)
				return null;

			return flight.request.headers[contentTypeKey].value[0] as string;
		}

		if (!flight.response)
			return null;

		const contentTypeKey = Object
			.keys(flight.response.headers)
			.find(k => k.toLowerCase() === 'content-type');

		if (!contentTypeKey)
			return null;

		return flight.response.headers[contentTypeKey];
	}, [flight.flightId]);
}
