import { editorPreferencesSetSelectedVariableGroup } from '@beak/app/store/preferences/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

export interface VariableGroupsProps {
	collapsed: boolean;
}

const VariableGroups: React.FunctionComponent<VariableGroupsProps> = ({ collapsed }) => {
	const dispatch = useDispatch();
	const { variableGroups } = useSelector(s => s.global.variableGroups)!;
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);

	return (
		<Container collapsed={collapsed}>
			{TypedObject.keys(variableGroups!).map(k => {
				const groups = variableGroups![k].groups;
				const groupKeys = TypedObject.keys(groups);
				const value = selectedGroups[k];

				return (
					<Item key={k}>
						<GroupName>
							{k}
						</GroupName>

						<Selector>
							<select
								value={value}
								onChange={e => {
									dispatch(editorPreferencesSetSelectedVariableGroup({
										variableGroup: k,
										groupId: e.target.value,
									}));
								}}
							>
								{groupKeys.map(gk => (
									<option key={gk} value={gk}>{groups[gk]}</option>
								))}
							</select>
						</Selector>
					</Item>
				);
			})}
		</Container>
	);
};

const Container = styled.div<{ collapsed: boolean }>`
	padding: 4px 14px;
	padding-right: 3px;

	overflow-y: scroll;
	max-height: 120px;

	${p => p.collapsed ? 'flex: 0; padding: 0;' : ''}
`;

const Item = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 2px 0;
`;

const GroupName = styled.span`
	min-width: 80px;
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;
`;

const Selector = styled.div`
	position: relative;
	margin-right: -3px;

	> select {
		font-size: 12px;
		border: 0;
		border-radius: 4px;
		background: none;
		color: ${p => p.theme.ui.textMinor};
		text-align-last: right;

		&:hover, &:active, &:focus {
			background: ${p => p.theme.ui.surface};
			outline: none;
		}
	}
`;

export default VariableGroups;
