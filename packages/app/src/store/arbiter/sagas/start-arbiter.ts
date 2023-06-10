import { createTakeLatestSagaSet } from '@beak/app/utils/redux/sagas';

import { actions } from '..';

export default createTakeLatestSagaSet(actions.startArbiter, function* startArbiterWorker() {
	// Removed for now
});
