export * from './flight';
export * from './healthz';
export * from './pairing';

/**
 * Default port range scanned by the renderer and bound by the agent. See
 * `docs/adr/0001-local-agent-for-web-host.md` (Discovery sub-decision).
 */
export const AGENT_PORT_RANGE_START = 47821;
export const AGENT_PORT_RANGE_END = 47840;

export const AGENT_HEALTHZ_PATH = '/.beak/agent/healthz';
export const AGENT_PAIR_PATH = '/pair';
export const AGENT_PAIR_TOKEN_PATH = '/pair/token';
export const AGENT_FLIGHT_PATH = '/flight';

export const AGENT_FINGERPRINT_NAME = 'beak';
