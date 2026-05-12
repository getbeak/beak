import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../features/tabs/store/actions';
import { createNewRequest } from '../store/project/actions';
import { useAppSelector } from '../store/redux';

/**
 * When the welcome screen's "Get started" button is clicked: open the first
 * existing request if there is one, otherwise spawn a new request to edit.
 *
 * Replaces the legacy `defaultOrCreateRequest` saga. The saga was just a
 * select + put chain — direct hook usage is simpler.
 */
export function useDefaultOrCreateRequest() {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);

	return useCallback(() => {
		const request = Object.values(tree).find(n => n.type === 'request');

		if (request) {
			dispatch(changeTab({ type: 'request', temporary: false, payload: request.id }));
			return;
		}

		dispatch(createNewRequest({ highlightedNodeId: void 0, name: 'New request' }));
	}, [dispatch, tree]);
}
