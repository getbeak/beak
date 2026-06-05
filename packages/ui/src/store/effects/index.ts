import { startAppListening } from '../listener';
import { registerAgentEffects } from './agent';
import { registerAlertsEffects } from './alerts';
import { registerCookieEffects } from './cookies';
import { registerEndpointSyncEffects } from './endpoint-sync';
import { registerExtensionsEffects } from './extensions';
import { registerFlightEffects } from './flight';
import { registerFlightHistoryEffects } from './flight-history';
import { registerGitEffects } from './git';
import { registerPreferencesEffects } from './preferences';
import { registerProjectEffects } from './project';
import { registerRequestValuesEffects } from './request-values';
import { registerSocketEffects } from './sockets';
import { registerTabsEffects } from './tabs';
import { registerVariableSetsEffects } from './variable-sets';
import { registerWorkflowsEffects } from './workflows';

/**
 * Register every former-saga effect with the listener middleware. Called
 * once from `configureStore`. Each module owns its own registrations so
 * adding a new effect doesn't require editing this file.
 */
export function registerAllEffects(): void {
	registerAgentEffects(startAppListening);
	registerAlertsEffects(startAppListening);
	registerCookieEffects(startAppListening);
	registerEndpointSyncEffects(startAppListening);
	registerExtensionsEffects(startAppListening);
	registerFlightEffects(startAppListening);
	registerFlightHistoryEffects(startAppListening);
	registerGitEffects(startAppListening);
	registerPreferencesEffects(startAppListening);
	registerProjectEffects(startAppListening);
	registerRequestValuesEffects(startAppListening);
	registerSocketEffects(startAppListening);
	registerTabsEffects(startAppListening);
	registerVariableSetsEffects(startAppListening);
	registerWorkflowsEffects(startAppListening);
}
