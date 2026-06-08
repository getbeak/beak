import binaryStore from '@beak/ui/lib/binary-store';
import { requestAllowsBody } from '@beak/ui/utils/http';
import type { Flight } from '@getbeak/types/flight';
import { useMemo } from 'react';

export type NotEligible = 'request_invalid_body' | 'request_no_body' | 'response_no_body';
type ReturnType = ['eligible', Uint8Array] | [NotEligible, null];

const encoder = new TextEncoder();

export default function useFlightBodyInfo(flight: Flight, mode: 'request' | 'response'): ReturnType {
	return useMemo<ReturnType>(() => {
		const { request, response } = flight;

		if (mode === 'request') {
			const { body, verb } = request;

			if (!requestAllowsBody(verb)) return ['request_no_body', null];

			if (body.type === 'text') {
				if (body.payload === '') return ['request_no_body', null];
				return ['eligible', encoder.encode(body.payload)];
			}

			if (body.type === 'file') {
				// File body bytes live behind a ValueProducerHandle now. Inline
				// producers carry the bytes directly; asset / stream producers
				// don't materialise them in renderer state, so the preview pane
				// can't show them synchronously. Future polish: read via IPC.
				const producer = body.payload.producer;
				if (producer?.kind === 'inline') return ['eligible', producer.bytes];
				return ['request_no_body', null];
			}

			return ['request_invalid_body', null];
		}

		if (!response || !response.hasBody) return ['response_no_body', null];

		const bytes = binaryStore.get(flight.binaryStoreKey);
		if (!bytes) return ['response_no_body', null];

		return ['eligible', bytes];
	}, [flight.flightId, mode]);
}
