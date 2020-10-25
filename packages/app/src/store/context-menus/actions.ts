import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	Commands,
} from './types';

export const executeCommand = createAction<Commands>(ActionTypes.EXECUTE_COMMAND);

export default {
	executeCommand,
};
