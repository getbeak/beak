import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import VGE from '../features/variable-groups/components/VariableGroupEditor';
import { actions } from '../store/variable-groups';

const VariableGroupEditor: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const params = new URLSearchParams(window.location.search);
	const projectPath = decodeURIComponent(params.get('projectPath') as string);
	const vg = useSelector(s => s.global.variableGroups);

	useEffect(() => {
		dispatch(actions.startVariableGroups(projectPath));
	}, [projectPath]);

	if (!vg.loaded)
		return null;

	return (
		<Wrapper>
			<VGE variableGroups={vg.variableGroups!} />
		</Wrapper>
	);
};

const Wrapper = styled.div`
	height: 100vh;
	background-color: ${props => props.theme.ui.background};
`;

export default VariableGroupEditor;
