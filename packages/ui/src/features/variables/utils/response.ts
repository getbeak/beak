import { TypedObject } from '@beak/common/helpers/typescript';
import type { Context } from '@getbeak/types/values';

export function getLatestFlight(id: string, ctx: Context) {
	const requestFlightHistory = ctx.flightHistory[id];

	if (!requestFlightHistory)
		return null;

	const latestFlight = TypedObject.values(requestFlightHistory.history).reverse()[0];

	return latestFlight;
}
