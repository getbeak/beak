/**
 * Whether this host can route flights through a local agent process.
 *
 *   'unsupported' — host has its own request execution. Renderer skips
 *                   all agent UI and state.
 *   'optional'    — host can use a paired agent if one is reachable,
 *                   falls back to its default path otherwise.
 *   'required'    — host has no other way to fire requests. Renderer
 *                   forces pair-or-fail UI.
 *
 * See docs/adr/0001-local-agent-for-web-host.md.
 *
 * Lives in `@beak/common` so both `@beak/state` and `@beak/runtime-shared`
 * can import it without violating the package dependency direction.
 */
export type LocalAgentCapability = 'unsupported' | 'optional' | 'required';
