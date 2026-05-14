import { createAction } from '@reduxjs/toolkit';

import type {
	ClearBodyPropertyValuePayload,
	ClearScalarValuePayload,
	HydrateRequestValuesPayload,
	RemoveRequestValuesPayload,
	ReplaceRequestValuesPayload,
	SetBodyPropertyValuePayload,
	SetBodyValuePayload,
	SetScalarValuePayload,
	ToggleScalarEnabledPayload,
} from './types';

/** Bulk-load values for every request — fired after the project loads. */
export const hydrateRequestValues = createAction<HydrateRequestValuesPayload>(
	'requestValues/hydrate',
);

/** Replace the entire values envelope for one request (e.g. after migration). */
export const replaceRequestValues = createAction<ReplaceRequestValuesPayload>(
	'requestValues/replace',
);

/** Drop a request's values — fired when the request is deleted. */
export const removeRequestValues = createAction<RemoveRequestValuesPayload>(
	'requestValues/remove',
);

// ─── Scalar (header/query) ────────────────────────────────────────────────

export const setScalarValue = createAction<SetScalarValuePayload>(
	'requestValues/setScalar',
);

export const clearScalarValue = createAction<ClearScalarValuePayload>(
	'requestValues/clearScalar',
);

export const toggleScalarEnabled = createAction<ToggleScalarEnabledPayload>(
	'requestValues/toggleScalarEnabled',
);

// ─── Body ─────────────────────────────────────────────────────────────────

/** Replace the entire body cell (e.g. on body-type change). */
export const setBodyValue = createAction<SetBodyValuePayload>(
	'requestValues/setBody',
);

/** Set one property inside a structured body (json / url_encoded_form / graphql). */
export const setBodyPropertyValue = createAction<SetBodyPropertyValuePayload>(
	'requestValues/setBodyProperty',
);

/** Clear one property inside a structured body. */
export const clearBodyPropertyValue = createAction<ClearBodyPropertyValuePayload>(
	'requestValues/clearBodyProperty',
);
