import { RecentLocalProject } from '@beak/common/dist/types/beak-hub';
import { ArbiterStatus } from '@beak/common/types/arbiter';
import { AuthenticateUserResponse, MagicStates } from '@beak/common/types/nest';
import ElectronStore from 'electron-store';

import { WindowState } from './window-state-manager';

export interface Store {
	recents: RecentLocalProject[];
	windowStates: Record<string, WindowState>;

	arbiter: ArbiterStatus;
	auth: AuthenticateUserResponse | null;
	magicStates: MagicStates;
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
		windowStates: {},

		arbiter: {
			lastCheck: '1989-12-13T00:00:00.01Z',
			status: false,
		},
		auth: null,
		magicStates: {},
	},
});

export default persistentStore;
