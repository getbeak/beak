import { createAction, createReducer } from '@reduxjs/toolkit';

/**
 * Phase machine for the Clone-from-Git flow.
 *
 *   idle            — closed; no clone is in flight.
 *   configuring     — dialog open with URL + target name fields.
 *   cloning         — host is running git.clone (network).
 *   result          — clone finished; success points to the new project,
 *                     failure carries the error message. Closing returns
 *                     to idle.
 */
export type Phase =
	| { phase: 'idle' }
	| { phase: 'configuring'; url: string; targetName: string; error?: string }
	| { phase: 'cloning'; url: string; targetName: string; dir: string }
	| { phase: 'result'; outcome: { ok: true; dir: string; openable: boolean } | { ok: false; error: string } };

export interface State {
	current: Phase;
}

export const initialState: State = {
	current: { phase: 'idle' },
};

export const start = createAction('clone-repo/start');
export const close = createAction('clone-repo/close');
export const updateUrl = createAction<string>('clone-repo/updateUrl');
export const updateTargetName = createAction<string>('clone-repo/updateTargetName');
export const cloneSubmitted = createAction<{ url: string; targetName: string; dir: string }>('clone-repo/cloneSubmitted');
export const cloneSucceeded = createAction<{ dir: string; openable: boolean }>('clone-repo/cloneSucceeded');
export const cloneFailed = createAction<{ error: string }>('clone-repo/cloneFailed');
export const validationFailed = createAction<{ error: string }>('clone-repo/validationFailed');

export const reducer = createReducer(initialState, builder => {
	builder
		.addCase(start, state => {
			state.current = { phase: 'configuring', url: '', targetName: '' };
		})
		.addCase(close, state => {
			state.current = { phase: 'idle' };
		})
		.addCase(updateUrl, (state, { payload }) => {
			if (state.current.phase !== 'configuring') return;
			state.current.url = payload;
			if (state.current.error) delete state.current.error;
			// Auto-derive targetName from the URL the first time it's set.
			if (!state.current.targetName.trim()) {
				state.current.targetName = deriveTargetName(payload);
			}
		})
		.addCase(updateTargetName, (state, { payload }) => {
			if (state.current.phase !== 'configuring') return;
			state.current.targetName = payload;
			if (state.current.error) delete state.current.error;
		})
		.addCase(validationFailed, (state, { payload }) => {
			if (state.current.phase !== 'configuring') return;
			state.current.error = payload.error;
		})
		.addCase(cloneSubmitted, (state, { payload }) => {
			state.current = { phase: 'cloning', url: payload.url, targetName: payload.targetName, dir: payload.dir };
		})
		.addCase(cloneSucceeded, (state, { payload }) => {
			state.current = { phase: 'result', outcome: { ok: true, dir: payload.dir, openable: payload.openable } };
		})
		.addCase(cloneFailed, (state, { payload }) => {
			state.current = { phase: 'result', outcome: { ok: false, error: payload.error } };
		});
});

export function deriveTargetName(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return '';
	// Strip trailing `.git`, query, fragment.
	const stripped = trimmed.replace(/[?#].*$/, '').replace(/\.git$/, '');
	const parts = stripped.split(/[/:]/).filter(Boolean);
	const last = parts[parts.length - 1] ?? '';
	return last.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

export const actions = {
	start,
	close,
	updateUrl,
	updateTargetName,
	cloneSubmitted,
	cloneSucceeded,
	cloneFailed,
	validationFailed,
};

export default { reducer, initialState, actions };
