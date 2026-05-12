// Source of truth is @beak/core/arbiter.
import { type ArbiterState, initialArbiterState } from '@beak/core/arbiter';

export type State = ArbiterState;
export const initialState: State = initialArbiterState;

export default { initialState };
