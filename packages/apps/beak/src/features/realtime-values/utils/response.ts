import { TypedObject } from '@beak/shared-common/helpers/typescript';

import { Context } from '../types';

export function getLatestFlight(id: string, ctx: Context) {
	const requestFlightHistory = ctx.flightHistory[id];

	if (!requestFlightHistory)
		return null;

	const latestFlight = TypedObject.values(requestFlightHistory.history)[0];

	return latestFlight;
}
