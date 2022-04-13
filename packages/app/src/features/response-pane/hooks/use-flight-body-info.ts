import { useMemo } from 'react';
import binaryStore from '@beak/app/lib/binary-store';
import { Flight } from '@beak/app/store/flight/types';
import { requestAllowsBody } from '@beak/app/utils/http';

export type NotEligible = 'request_invalid_body' | 'request_no_body' | 'response_no_body';
type ReturnType = ['eligible', Uint8Array] | [NotEligible, null];

export default function useFlightBodyInfo(flight: Flight, mode: 'request' | 'response'): ReturnType {
	return useMemo<ReturnType>(() => {
		const { request, response } = flight;

		if (mode === 'request') {
			if (request.body.type !== 'text')
				return ['request_invalid_body', null];

			if (request.body.payload === '')
				return ['request_no_body', null];

			if (!requestAllowsBody(request.verb))
				return ['request_no_body', null];

			const encoder = new TextEncoder();

			return ['eligible', encoder.encode(request.body.payload)];
		}

		if (!response || !response.hasBody)
			return ['response_no_body', null];

		return ['eligible', binaryStore.get(flight.binaryStoreKey)];
	}, [flight.flightId]);
}
