import { actions } from '@beak/ui/store/variable-sets';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection, { type InlineSectionAction } from '../../sidebar/components/SidebarPaneSection';
import { changeTab } from '../../tabs/store/actions';
import VariableSets from './organisms/VariableSets';

const VariablesPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	const sectionActions = useMemo<InlineSectionAction[]>(
		() => [
			{
				id: 'variables-pane:new-variable-set',
				label: 'New variable set',
				icon: Plus,
				onClick: () => {
					dispatch(actions.createNewVariableSet({}));
					dispatch(
						changeTab({
							type: 'variable_set_editor',
							payload: 'New variable set',
							temporary: false,
						}),
					);
				},
			},
		],
		[dispatch],
	);

	return (
		<SidebarPane>
			<SidebarPaneSection
				title={'Variable sets'}
				collapseKey={'beak.variables.variable-sets'}
				disableCollapse
				inlineActions={sectionActions}
			>
				<VariableSets />
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default VariablesPane;
