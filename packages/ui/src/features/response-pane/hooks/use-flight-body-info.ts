import { useMemo } from 'react';
import binaryStore from '@beak/ui/lib/binary-store';
import { requestAllowsBody } from '@beak/ui/utils/http';
import type { Flight } from '@getbeak/types/flight';
import { RequestBodyFile } from 'packages/types/request';

export type NotEligible = 'request_invalid_body' | 'request_no_body' | 'response_no_body';
type ReturnType = ['eligible', Uint8Array] | [NotEligible, null];

const encoder = new TextEncoder();

export default function useFlightBodyInfo(flight: Flight, mode: 'request' | 'response'): ReturnType {
	return useMemo<ReturnType>(() => {
		const { request, response } = flight;

		if (mode === 'request') {
			if (!['text', 'file'].includes(request.body.type))
				return ['request_invalid_body', null];

			if (request.body.payload === '')
				return ['request_no_body', null];

			if (!requestAllowsBody(request.verb))
				return ['request_no_body', null];

			if (request.body.type === 'text')
				return ['eligible', encoder.encode(request.body.payload)];

			return [
				'eligible',
				(request.body as RequestBodyFile).payload.__hacky__binaryFileData! as Uint8Array,
			];
		}

		if (!response || !response.hasBody)
			return ['response_no_body', null];

		return ['eligible', binaryStore.get(flight.binaryStoreKey)];
	}, [flight.flightId]);
}
