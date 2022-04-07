import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSectionBody from '@beak/app/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/app/store/preferences/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

const VariableGroups: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const { variableGroups } = useSelector(s => s.global.variableGroups)!;
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);

	useSectionBody({
		maxHeight: '120px',
		minHeight: '26px',
		flexShrink: 0,
	});

	return (
		<Container>
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

const Container = styled.div`
	padding: 4px 5px;
	padding-right: 3px;
	padding-bottom: 0;

	max-height: 120px;
	min-height: 26px;
`;

const Item = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 4px 0;

	&:first-child {
		margin-top: 0;
	}
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
