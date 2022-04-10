import { ArbiterStatus } from '@beak/common/types/arbiter';
import { RecentLocalProject } from '@beak/common/types/beak-hub';
import { MagicStates } from '@beak/common/types/nest';
import crypto from 'crypto';
import ElectronStore from 'electron-store';

import { WindowState } from './window-state-manager';

export type Environment = 'prod' | 'nonprod';

export interface Store {
	recents: RecentLocalProject[];
	windowStates: Record<string, WindowState>;
	beakId: string;

	environment: Environment;
	arbiter: ArbiterStatus;
	magicStates: MagicStates;

	passedOnboarding: boolean;
	projectMappings: Record<string, string>;
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
		windowStates: {},
		beakId: crypto.randomBytes(128).toString('base64url'),

		environment: 'prod',
		arbiter: {
			lastSuccessfulCheck: '1989-12-13T00:00:00Z',
			lastCheckError: null,
			lastCheck: new Date().toISOString(),
			status: false,
		},
		magicStates: {},
		passedOnboarding: false,
		projectMappings: {},
	},
});

export default persistentStore;
