import React from 'react';
import { useDispatch } from 'react-redux';
import { changeTab } from '@beak/app/features/tabs/store/actions';

interface VariableGroupItemProps {
	variableGroupName: string;
}

const VariableGroupItem: React.FunctionComponent<VariableGroupItemProps> = ({ variableGroupName }) => {
	const dispatch = useDispatch();

	return (
		<p onClick={() => dispatch(changeTab({
			type: 'variable_group_editor',
			payload: variableGroupName,
			temporary: true,
		}))}>
			{variableGroupName}
		</p>
	);
};

export default VariableGroupItem;
