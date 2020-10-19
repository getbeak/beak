import React from 'react';
import { useSelector } from 'react-redux';

import FolderItem from './FolderItem';
import RequestItem from './RequestItem';

interface SwitchProps {
	id: string;
	depth: number;
}

const Switch: React.FunctionComponent<SwitchProps> = props => {
	const node = useSelector(s => s.global.project.tree![props.id]);

	if (node.type === 'folder')
		return <FolderItem depth={props.depth} id={props.id} />;

	return <RequestItem depth={props.depth} id={props.id} />;
};

export default Switch;
