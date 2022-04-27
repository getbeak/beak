import React from 'react';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import { FolderNode, RequestNode } from '@beak/shared-common/types/beak-project';

import { Context } from '../../realtime-values/types';

export default function renderRequestSelectOptions(context: Context) {
	const depth = 0;
	const formattedNodes = TypedObject.values(context.projectTree)
		.filter(t => t.parent === 'tree')
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	return (
		<React.Fragment>
			{formattedNodes.filter(i => i.type === 'folder')
				.map(i => renderFolder(i as FolderNode, context, depth))}
			{formattedNodes.filter(i => i.type === 'request')
				.map(i => renderRequest(i as RequestNode, depth))}
		</React.Fragment>
	);
}

function renderFolder(node: FolderNode, context: Context, depth: number) {
	const newDepth = depth + 1;
	const childNodes = TypedObject.values(context.projectTree)
		.filter(i => i.parent === node.filePath)
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	const folderNodes = childNodes.filter(n => n.type === 'folder') as FolderNode[];
	const nodes = childNodes.filter(n => n.type === 'request') as RequestNode[];

	return (
		<React.Fragment key={node.id}>
			<optgroup label={`${renderDepth(depth)}${node.name}`}>
				{nodes.map(n => renderRequest(n, newDepth))}
			</optgroup>
			{folderNodes.map(n => renderFolder(n, context, newDepth))}
		</React.Fragment>
	);
}

function renderRequest(node: RequestNode, depth: number) {
	return (
		<option value={node.id} key={node.id}>
			{`${renderDepth(depth)}${node.name}`}
		</option>
	);
}

function renderDepth(depth: number) {
	return '\u00A0'.repeat(depth * 2);
}
