import { deprecated } from 'typesafe-actions';

import { ActionTypes, ProjectOpenedPayload } from './types';

const { createAction } = deprecated;

export const openProject = createAction(
	ActionTypes.OPEN_PROJECT,
	action => (projectPath: string) => action({ projectPath }),
);

export const projectOpened = createAction(
	ActionTypes.PROJECT_OPENED,
	action => (project: ProjectOpenedPayload) => action(project),
);

export default {
	openProject,
	projectOpened,
};
