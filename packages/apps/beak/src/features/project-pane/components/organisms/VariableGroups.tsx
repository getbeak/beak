import React from 'react';
import { useDispatch } from 'react-redux';
import { SilentAbbr } from '@beak/app-beak/components/atoms/Abbr';
import useSectionBody from '@beak/app-beak/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/app-beak/store/preferences/actions';
import { useAppSelector } from '@beak/app-beak/store/redux';
import { TypedObject } from '@beak/shared-common/helpers/typescript';
import styled from 'styled-components';

import NoVariableGroups from '../molecules/NoVariableGroups';

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
						<GroupName>
							<SilentAbbr title={k}>{k}</SilentAbbr>
						</GroupName>

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
	grid-template-columns: 1fr 1fr;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	margin: 4px 0;
	max-width: 100%;

	&:first-child {
		margin-top: 0;
	}

	&:not(:last-child) {
		margin-bottom: 6px;
	}
`;

const GroupName = styled.span`
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;

	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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
