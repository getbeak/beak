import { TypedObject } from '@beak/common/dist/helpers/typescript';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export interface VariableGroupsProps {
	collapsed: boolean;
}

const VariableGroups: React.FunctionComponent<VariableGroupsProps> = ({ collapsed }) => {
	const vg = useSelector(s => s.global.variableGroups);
	const variableGroups = useSelector(s => s.global.variableGroups.variableGroups!);
	const [selectionMapping, setSelection] = useState<Record<string, string>>({});

	if (vg.opening)
		return null;

	return (
		<Container collapsed={collapsed}>
			{TypedObject.keys(variableGroups).map(k => {
				const groups = variableGroups[k].groups;
				const groupKeys = TypedObject.keys(groups);
				const value = selectionMapping[k] || groupKeys[0];

				return (
					<Item key={k}>
						<GroupName>
							{k}
						</GroupName>

						<Selector>
							<select
								value={value}
								onChange={e => {
									setSelection({
										...selectionMapping,
										[k]: e.target.value,
									});
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
