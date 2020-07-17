import { deprecated } from 'typesafe-actions';

import { ActionTypes } from './types';

const { createAction } = deprecated;

export const openProject = createAction(
	ActionTypes.OPEN_PROJECT,
	action => (projectPath: string) => action({ projectPath }),
);

export default {
	openProject,
};
