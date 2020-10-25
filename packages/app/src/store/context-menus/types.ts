export const ActionTypes = {
	EXECUTE_COMMAND: '@beak/global/context-menus/EXECUTE_COMMAND',
};

export type CommandTypes = 'reveal_in_finder';

export type Commands = RevealInFinderCommand | CreateNewRequestCommand;

export interface RevealInFinderCommand {
	type: 'reveal_in_finder';
	payload: string;
}

export interface CreateNewRequestCommand {
	type: 'create_new_request';
	payload: string;
}

export default {
	ActionTypes,
};
