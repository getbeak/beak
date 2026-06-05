/**
 * Local-agent runtime state. See
 * `docs/adr/0001-local-agent-for-web-host.md` for the protocol; the
 * rest of this file mirrors the Decision §6 state-machine table.
 */

export type AgentStatus =
	| 'idle'
	| 'discovering'
	| 'unreachable'
	| 'unpaired'
	| 'pairing'
	| 'paired'
	| 'verifying'
	| 'impostor';

export type AgentRoutingMode = 'agent-when-available' | 'agent-only' | 'browser-only';

export interface AgentSliceState {
	status: AgentStatus;
	baseUrl?: string;
	tokenId?: string;
	agentVersion?: string;
	agentSupports?: string[];
	lastSeenAt?: number;
	pairingError?: string;
	routingMode: AgentRoutingMode;
}

export const initialAgentState: AgentSliceState = {
	status: 'idle',
	routingMode: 'agent-when-available',
};
