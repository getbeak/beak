// Source of truth is @beak/state/arbiter.
import { type ArbiterState, initialArbiterState } from '@beak/state/arbiter';

export type State = ArbiterState;
export const initialState: State = initialArbiterState;

export default { initialState };
