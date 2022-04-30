import { useMemo } from 'react';
import type { Flight } from '@getbeak/types/flight';
import mime from 'mime-types';

export default function useDetectedFlightFormat(flight: Flight, mode: 'request' | 'response'): [string | null, string | null] {
	return useMemo(() => {
		const contentType = getContentType(flight, mode);

		if (!contentType)
			return [null, null];

		switch (true) {
			case contentType.startsWith('image/'):
				return [contentType, 'image'];

			default:
				return [contentType, mime.extension(contentType) || null];
		}
	}, [flight.flightId]);
}

function getContentType(flight: Flight, mode: 'request' | 'response') {
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
}
