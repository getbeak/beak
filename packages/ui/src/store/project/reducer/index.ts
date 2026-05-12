import { buildProjectTreeReducer } from '@beak/core/project';
import { createReducer } from '@reduxjs/toolkit';

import { initialState } from '../types';
import buildAlerts from './alerts';
import buildBody from './body';
import buildLifecycle from './lifecycle';
import buildRequestFields from './request-fields';
import buildTree from './tree';

const projectReducer = createReducer(initialState, builder => {
	// Pure project tree state — sourced from @beak/core/project.
	buildProjectTreeReducer(builder);

	// UI-coupled state.
	buildLifecycle(builder);
	buildRequestFields(builder);
	buildTree(builder);
	buildBody(builder);
	buildAlerts(builder);
});

export default projectReducer;
