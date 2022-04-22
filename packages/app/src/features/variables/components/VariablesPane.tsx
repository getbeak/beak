import React from 'react';
import { useDispatch } from 'react-redux';
import { actions } from '@beak/app/store/variable-groups';
import ksuid from '@cuvva/ksuid';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab } from '../../tabs/store/actions';
import VariableGroups from './organisms/VariableGroups';

const VariablesPane: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
