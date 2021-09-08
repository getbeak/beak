import { RecentLocalProject } from '@beak/common/types/beak-hub';
import { ArbiterStatus } from '@beak/common/types/arbiter';
import { MagicStates } from '@beak/common/types/nest';
import ElectronStore from 'electron-store';

import { WindowState } from './window-state-manager';

export interface Store {
	recents: RecentLocalProject[];
	windowStates: Record<string, WindowState>;

	arbiter: ArbiterStatus;
	magicStates: MagicStates;

	passedOnboarding: boolean;
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
		windowStates: {},

		arbiter: {
			lastSuccessfulCheck: '1989-12-13T00:00:00Z',
			lastCheckError: null,
			lastCheck: new Date().toISOString(),
			status: false,
		},
		magicStates: {},
		passedOnboarding: false,
	},
});

export default persistentStore;
