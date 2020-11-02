import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import VGE from '../features/variable-groups/components/VariableGroupEditor';
import { actions } from '../store/variable-groups';

const VariableGroupEditor: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const params = new URLSearchParams(window.location.search);
	const projectPath = decodeURIComponent(params.get('projectPath') as string);
	const vg = useSelector(s => s.global.variableGroups);

	useEffect(() => {
		dispatch(actions.openVariableGroups(projectPath));
	}, [projectPath]);

	if (vg.opening)
		return null;

	console.log(vg);

	return <VGE variableGroups={vg.variableGroups!} />;
};

export default VariableGroupEditor;
