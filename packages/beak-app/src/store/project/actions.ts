import { createAction } from 'typesafe-actions/dist/deprecated/create-action';

import { ActionTypes } from './types';

const { OPEN_PROJECT } = ActionTypes;

export const openProject = createAction(
	OPEN_PROJECT,
	action => (projectPath: string) => action({ projectPath }),
);

export default {
	openProject,
};
