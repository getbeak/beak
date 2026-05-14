import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { actions } from '@beak/ui/store/variable-sets';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab } from '../../tabs/store/actions';
import VariableSets from './organisms/VariableSets';

const VariablesPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	const sectionActions = useMemo(() => [{
		id: 'variables-pane:new-variable-set',
		label: 'New Variable Set',
		click: () => {
			dispatch(actions.createNewVariableSet({}));
			dispatch(changeTab({
				type: 'variable_set_editor',
				payload: 'New variable set',
				temporary: false,
			}));
		},
	}], [dispatch]);

	return (
		<SidebarPane>
			<SidebarPaneSection
				title={'Variable sets'}
				collapseKey={'beak.variables.variable-sets'}
				disableCollapse
				actions={sectionActions}
			>
				<VariableSets />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default VariablesPane;
