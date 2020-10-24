import { RecentLocalProject } from '@beak/common/dist/types/beak-hub';
import ElectronStore from 'electron-store';

export interface Store {
	recents: RecentLocalProject[];
}

const persistentStore = new ElectronStore<Store>({
	defaults: {
		recents: [],
	},
});

export default persistentStore;
