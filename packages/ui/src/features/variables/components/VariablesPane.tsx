import React from 'react';
import { useDispatch } from 'react-redux';
import ksuid from '@beak/ksuid';
import { actions } from '@beak/ui/store/variable-groups';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab } from '../../tabs/store/actions';
import VariableGroups from './organisms/VariableGroups';

const VariablesPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	return (
		<SidebarPane>
			<SidebarPaneSection
				title={'Variable groups'}
				collapseKey={'beak.variables.variable-groups'}
				disableCollapse
				actions={[{
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'New variable group',
					click: () => {
						dispatch(actions.createNewVariableGroup({ }));
						dispatch(changeTab({
							type: 'variable_group_editor',
							payload: 'New variable group',
							temporary: false,
						}));
					},
				}]}
			>
				<VariableGroups />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default VariablesPane;
