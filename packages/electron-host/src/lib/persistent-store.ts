import { RecentLocalProject } from '@beak/common/dist/types/beak-hub';
import { UserStore } from '@beak/common/dist/types/user';
import ElectronStore from 'electron-store';

import { WindowState } from './window-state-manager';

export interface Store {
	recents: RecentLocalProject[];
	user: UserStore | null;
	windowStates: Record<string, WindowState>;
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
		user: null,
		windowStates: {},
	},
});

export default persistentStore;
