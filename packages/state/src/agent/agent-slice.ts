import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type AgentRoutingMode, type AgentSliceState, type AgentStatus, initialAgentState } from './types';

interface DiscoveredPayload {
	baseUrl: string;
	agentVersion: string;
	agentSupports: string[];
	lastSeenAt: number;
}

const agentSlice = createSlice({
	name: 'agent',
	initialState: initialAgentState,
	reducers: {
		setAgentStatus: (state, action: PayloadAction<AgentStatus>) => {
			state.status = action.payload;
		},
		startDiscovery: state => {
			state.status = 'discovering';
			delete state.pairingError;
		},
		agentDiscovered: (state, action: PayloadAction<DiscoveredPayload>) => {
			state.baseUrl = action.payload.baseUrl;
			state.agentVersion = action.payload.agentVersion;
			state.agentSupports = action.payload.agentSupports;
			state.lastSeenAt = action.payload.lastSeenAt;
			// If a token was already present, the verify thunk transitions to
			// 'paired' or 'impostor'; otherwise we land in 'unpaired'.
			state.status = state.tokenId ? 'verifying' : 'unpaired';
		},
		agentUnreachable: state => {
			state.status = 'unreachable';
			delete state.baseUrl;
		},
		startPairing: state => {
			state.status = 'pairing';
			delete state.pairingError;
		},
		pairingSucceeded: (state, action: PayloadAction<{ tokenId: string; lastSeenAt: number }>) => {
			state.status = 'paired';
			state.tokenId = action.payload.tokenId;
			state.lastSeenAt = action.payload.lastSeenAt;
			delete state.pairingError;
		},
		pairingFailed: (state, action: PayloadAction<{ error: string }>) => {
			state.status = 'unpaired';
			state.pairingError = action.payload.error;
		},
		verifyOk: (state, action: PayloadAction<{ lastSeenAt: number }>) => {
			state.status = 'paired';
			state.lastSeenAt = action.payload.lastSeenAt;
		},
		verifyImpostor: state => {
			state.status = 'impostor';
			delete state.baseUrl;
		},
		tokenRevoked: state => {
			state.status = state.baseUrl ? 'unpaired' : 'unreachable';
			delete state.tokenId;
		},
		setRoutingMode: (state, action: PayloadAction<AgentRoutingMode>) => {
			state.routingMode = action.payload;
		},
		hydrateAgent: (state, action: PayloadAction<Partial<AgentSliceState>>) => {
			Object.assign(state, action.payload);
		},
	},
});

export const {
	setAgentStatus,
	startDiscovery,
	agentDiscovered,
	agentUnreachable,
	startPairing,
	pairingSucceeded,
	pairingFailed,
	verifyOk,
	verifyImpostor,
	tokenRevoked,
	setRoutingMode,
	hydrateAgent,
} = agentSlice.actions;

export default agentSlice.reducer;

// -- selectors --

interface AgentRootState {
	global: { agent: AgentSliceState };
}

export const selectAgentStatus = (state: AgentRootState) => state.global.agent.status;
export const selectAgentBaseUrl = (state: AgentRootState) => state.global.agent.baseUrl;
export const selectAgentTokenId = (state: AgentRootState) => state.global.agent.tokenId;
export const selectAgentRoutingMode = (state: AgentRootState) => state.global.agent.routingMode;
export const selectAgentVersion = (state: AgentRootState) => state.global.agent.agentVersion;
export const selectAgentLastSeenAt = (state: AgentRootState) => state.global.agent.lastSeenAt;
export const selectAgentPairingError = (state: AgentRootState) => state.global.agent.pairingError;
