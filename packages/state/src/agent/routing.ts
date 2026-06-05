import type { AgentRoutingMode, AgentSliceState, AgentStatus } from './types';

export type LocalAgentCapability = 'unsupported' | 'optional' | 'required';

interface RoutingInput {
	capability: LocalAgentCapability;
	status: AgentStatus;
	routingMode: AgentRoutingMode;
}

/**
 * The single decision function for "does this flight go through the
 * agent?". Mirrors the table in `docs/adr/0001-local-agent-for-web-host.md`
 * Decision §6.
 *
 * Returns 'via-agent' or 'via-default' for the easy cases. Returns
 * 'force-fail' when the user demands an agent (`agent-only`) but none
 * is paired — the flight should not silently fall back; the renderer
 * surfaces an explicit error.
 */
export function decideRouting(input: RoutingInput): 'via-agent' | 'via-default' | 'force-fail' {
	const { capability, status, routingMode } = input;
	if (capability === 'unsupported') return 'via-default';

	if (capability === 'required') {
		return status === 'paired' ? 'via-agent' : 'force-fail';
	}

	// capability === 'optional'
	switch (routingMode) {
		case 'browser-only':
			return 'via-default';
		case 'agent-only':
			return status === 'paired' ? 'via-agent' : 'force-fail';
		case 'agent-when-available':
			return status === 'paired' ? 'via-agent' : 'via-default';
	}
}

interface AgentRoutingRootState {
	global: { agent: AgentSliceState };
}

/**
 * Convenience selector for use sites that have access to the root
 * state but not the static capability. Pass the capability in
 * separately (it lives in the runtime, not the store).
 */
export function selectRoutingDecision(capability: LocalAgentCapability) {
	return (state: AgentRoutingRootState) =>
		decideRouting({
			capability,
			status: state.global.agent.status,
			routingMode: state.global.agent.routingMode,
		});
}
