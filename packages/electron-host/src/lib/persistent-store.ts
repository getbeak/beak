import { RecentLocalProject } from '@beak/common/dist/types/beak-hub';
import { UserStore } from '@beak/common/dist/types/user';
import ElectronStore from 'electron-store';

export interface Store {
	recents: RecentLocalProject[];
	user: UserStore | null;
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
		user: null,
	},
});

export default persistentStore;
