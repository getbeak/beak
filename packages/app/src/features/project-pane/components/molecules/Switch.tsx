import React from 'react';
import { useSelector } from 'react-redux';

import FolderItem from './FolderItem';
import RequestItem from './RequestItem';

interface SwitchProps {
	id: string;
	depth: number;
	parentNode: null | HTMLElement;
}

const Switch: React.FunctionComponent<SwitchProps> = props => {
	const { id, depth, parentNode } = props;
	const node = useSelector(s => s.global.project.tree![id]);

	if (node.type === 'folder')
		return <FolderItem depth={depth} id={id} />;

	return <RequestItem depth={depth} id={id} parentNode={parentNode} />;
};

export default Switch;
