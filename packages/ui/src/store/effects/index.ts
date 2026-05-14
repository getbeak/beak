import { startAppListening } from '../listener';
import { registerExtensionsEffects } from './extensions';
import { registerFlightEffects } from './flight';
import { registerGitEffects } from './git';
import { registerPreferencesEffects } from './preferences';
import { registerProjectEffects } from './project';
import { registerSocketEffects } from './sockets';
import { registerTabsEffects } from './tabs';
import { registerVariableSetsEffects } from './variable-sets';

/**
 * Register every former-saga effect with the listener middleware. Called
 * once from `configureStore`. Each module owns its own registrations so
 * adding a new effect doesn't require editing this file.
 */
export function registerAllEffects(): void {
	registerExtensionsEffects(startAppListening);
	registerFlightEffects(startAppListening);
	registerGitEffects(startAppListening);
	registerPreferencesEffects(startAppListening);
	registerProjectEffects(startAppListening);
	registerSocketEffects(startAppListening);
	registerTabsEffects(startAppListening);
	registerVariableSetsEffects(startAppListening);
}
