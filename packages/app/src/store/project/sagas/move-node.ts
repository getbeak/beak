import { moveNodesOnDisk } from '@beak/app/lib/beak-project/nodes';
import { Tree } from '@beak/common/types/beak-project';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, select } from 'redux-saga/effects';

import { ApplicationState } from '../..';
import { MoveNodeOnDiskPayload } from '../types';

export default function* workerMoveNode({ payload }: PayloadAction<MoveNodeOnDiskPayload>) {
	const tree: Tree = yield select((s: ApplicationState) => s.global.project.tree);
	const sourceNode = tree[payload.sourceNodeId];
	const destinationNode = tree[payload.destinationNodeId];

	if (!sourceNode || !destinationNode)
		return;

	yield call(moveNodesOnDisk, sourceNode, destinationNode);
}
