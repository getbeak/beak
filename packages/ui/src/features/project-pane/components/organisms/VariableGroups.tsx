import React from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import styled from 'styled-components';

import NoVariableGroups from '../molecules/NoVariableGroups';
import VariableGroupName from '../molecules/VariableGroupName';

const VariableGroups: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const { variableGroups } = useAppSelector(s => s.global.variableGroups)!;
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const empty = Object.keys(variableGroups).length === 0;

	useSectionBody({
		maxHeight: '120px',
		flexShrink: 0,
	});

	if (empty) {
		return (
			<Container>
				<NoVariableGroups />
			</Container>
		);
	}

	return (
		<Container>
			{TypedObject.keys(variableGroups!).map(k => {
				const groups = variableGroups![k].groups;
				const groupKeys = TypedObject.keys(groups);
				const value = selectedGroups[k];

				return (
					<Item key={k}>
						<VariableGroupName variableGroupName={k} />

						<Selector
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
						</Selector>
					</Item>
				);
			})}
		</Container>
	);
};

const Container = styled.div`
	padding: 4px 5px;
	padding-right: 0;
	padding-bottom: 0;
`;

const Item = styled.div`
	display: grid;
	grid-template-columns: minmax(10px, max-content) minmax(10px, max-content);
	justify-content: space-between;
	align-items: center;
	gap: 5px;
	margin: 4px 0;
	max-width: calc(100% - 3px);

	&:first-child {
		margin-top: 0;
	}

	&:not(:last-child) {
		margin-bottom: 6px;
	}
`;

const Selector = styled.select`
	width: 100%;
	font-size: 12px;
	border: 0;
	border-radius: 4px;
	background: none;
	color: ${p => p.theme.ui.textMinor};
	text-align-last: right;
	text-overflow: ellipsis;

	&:hover, &:active, &:focus {
		background: ${p => p.theme.ui.surface};
		outline: none;
	}
`;

export default VariableGroups;
