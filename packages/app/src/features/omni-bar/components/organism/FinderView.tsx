import { tabSelected } from '@beak/app/store/project/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestNode } from '@beak/common/types/beak-project';
import Fuse from 'fuse.js';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import FinderRequestItem from '../molecule/FinderRequestItem';

export interface FinderViewProps {
	content: string;
	reset: () => void;
}

const FinderView: React.FunctionComponent<FinderViewProps> = ({ content, reset }) => {
	const dispatch = useDispatch();
	const tree = useSelector(s => s.global.project.tree) || {};
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const flattened = TypedObject.values(tree).filter(t => t.type === 'request') as RequestNode[];
	const [matches, setMatches] = useState<string[] | undefined>(void 0);
	const context = { projectPath, selectedGroups, variableGroups };

	const fuse = new Fuse(flattened, {
		includeScore: true,
		keys: [
			'name',
			'info.uri.host',
			'info.uri.path',
		],
	});

	useEffect(() => {
		const matchedIds = fuse.search(content).map(s => s.item.id);

		setMatches(matchedIds);
	}, [content]);

	if (!content)
		return null;

	return (
		<Container tabIndex={0}>
			{matches?.map((k, index) => {
				const match = tree[k];
				const reqNode = match as RequestNode;

				return (
					<Item
						key={k}
						tabIndex={index + 1}
						onClick={() => {
							dispatch(tabSelected({
								type: 'request',
								payload: k,
								temporary: true,
							}));
							reset();
						}}
					>
						{match.name}
						{match.type === 'request' && (
							<React.Fragment>
								{' - '}
								<FinderRequestItem context={context} info={reqNode.info} />
							</React.Fragment>
						)}
					</Item>
				);
			})}
		</Container>
	);
};

const Container = styled.div`
	border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	padding: 8px 0;
`;

const Item = styled.div`
	font-size: 13px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	padding: 4px 10px;
	cursor: pointer;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;

	&:hover {
		background: ${p => p.theme.ui.secondaryActionMuted};
	}
`;

export default FinderView;
