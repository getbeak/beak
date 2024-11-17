import React from 'react';
import { useDispatch } from 'react-redux';
import ksuid from '@beak/ksuid';
import { actions } from '@beak/ui/store/variable-sets';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab } from '../../tabs/store/actions';
import VariableSets from './organisms/VariableSets';

const VariablesPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	return (
		<SidebarPane>
			<SidebarPaneSection
				title={'Variable sets'}
				collapseKey={'beak.variables.variable-sets'}
				disableCollapse
				actions={[{
					id: ksuid.generate('ctxmenuitem').toString(),
					label: 'New variable set',
					click: () => {
						dispatch(actions.createNewVariableSet({ }));
						dispatch(changeTab({
							type: 'variable_set_editor',
							payload: 'New variable set',
							temporary: false,
						}));
					},
				}]}
			>
				<VariableSets />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default VariablesPane;
