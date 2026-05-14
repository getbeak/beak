import type { BodyValue, PropertyValue, RequestValues } from '../schemas/request-values';

/**
 * Where in a request's values a property lives. Headers and query are keyed
 * by property id; body is a single discriminated cell (the type-specific
 * payload lives inside `BodyValue`).
 */
export type PropertyScope = 'headers' | 'query';

export interface HydrateRequestValuesPayload {
	requests: Record<string, RequestValues>;
}

export interface ReplaceRequestValuesPayload {
	requestId: string;
	values: RequestValues;
}

export interface SetScalarValuePayload {
	requestId: string;
	scope: PropertyScope;
	propertyId: string;
	value: PropertyValue;
}

export interface ClearScalarValuePayload {
	requestId: string;
	scope: PropertyScope;
	propertyId: string;
}

export interface ToggleScalarEnabledPayload {
	requestId: string;
	scope: PropertyScope;
	propertyId: string;
	enabled: boolean;
}

export interface SetBodyValuePayload {
	requestId: string;
	body: BodyValue;
}

export interface SetBodyPropertyValuePayload {
	requestId: string;
	propertyId: string;
	value: PropertyValue;
}

export interface ClearBodyPropertyValuePayload {
	requestId: string;
	propertyId: string;
}

export interface RemoveRequestValuesPayload {
	requestId: string;
}
