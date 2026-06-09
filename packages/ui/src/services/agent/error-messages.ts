/**
 * Map raw agent-flow error codes (the strings thrown from `pairing.ts`
 * and dispatched onto `state.global.agent.pairingError`) to user-facing
 * messages. The raw codes are stable identifiers — they belong in logs
 * and bug reports, not on screen.
 *
 * Unknown codes fall back to a generic message; the raw code is still
 * returned in `detail` so a curious user / support agent can copy it.
 */
export interface FriendlyError {
	title: string;
	detail: string;
}

const PAIRING_MESSAGES: Record<string, FriendlyError> = {
	pairing_access_denied: {
		title: 'Pairing cancelled',
		detail: 'You denied the pair request in the agent window.',
	},
	pairing_invalid_request: {
		title: 'Pair link was malformed',
		detail: 'Start pairing again from Beak.',
	},
	pairing_missing_code_or_state: {
		title: 'Pair link was incomplete',
		detail: 'Start pairing again from Beak.',
	},
	pairing_no_pending: {
		title: 'Pair link expired',
		detail: 'Pair links last five minutes. Start pairing again from Beak.',
	},
	pairing_corrupt_pending: {
		title: 'Pair record was corrupted',
		detail: 'Start pairing again from Beak.',
	},
	pairing_state_mismatch: {
		title: 'Pair link doesn’t match this browser',
		detail: 'The link must be opened in the same browser session that started it.',
	},
	pairing_storage_unavailable: {
		title: 'Browser storage isn’t available',
		detail: 'Enable cookies and local storage (private mode often blocks them), then try again.',
	},
	pairing_invalid_token_response: {
		title: 'Agent returned an unexpected response',
		detail: 'Try restarting the agent and pairing again.',
	},
	agent_unreachable: {
		title: 'Couldn’t reach the agent',
		detail: 'Make sure the Beak agent is running on this machine.',
	},
	agent_unauthorized: {
		title: 'Agent rejected the token',
		detail: 'The agent revoked or rotated the pairing. Pair again.',
	},
	agent_disconnected: {
		title: 'Lost contact with the agent',
		detail: 'The connection dropped mid-request. Check that the agent is still running.',
	},
};

export function friendlyPairingError(code: string | undefined | null): FriendlyError {
	if (!code) {
		return { title: 'Pairing didn’t finish', detail: 'Try again.' };
	}
	const direct = PAIRING_MESSAGES[code];
	if (direct) return direct;

	// `pairing_token_exchange_failed_<status>_<detail>` carries an HTTP
	// status we can surface without revealing the agent's raw error text.
	const tokenExchange = /^pairing_token_exchange_failed_(\d{3})/.exec(code);
	if (tokenExchange) {
		return {
			title: 'Agent rejected the pair request',
			detail: `The agent returned HTTP ${tokenExchange[1]}. Try restarting it and pairing again.`,
		};
	}

	return {
		title: 'Pairing didn’t finish',
		detail: `Unexpected error (${code}). Try again, or restart the agent.`,
	};
}
