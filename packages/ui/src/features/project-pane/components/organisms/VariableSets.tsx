import React from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableSet } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import styled from 'styled-components';

import NoVariableSets from '../molecules/NoVariableSets';
import VariableSetName from '../molecules/VariableSetName';

const VariableSets: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const { variableSets } = useAppSelector(s => s.global.variableSets)!;
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const empty = Object.keys(variableSets).length === 0;

	useSectionBody({
		maxHeight: '120px',
		flexShrink: 0,
	});

	if (empty) {
		return (
			<Container>
				<NoVariableSets />
			</Container>
		);
	}

	return (
		<Container>
			{TypedObject.keys(variableSets!).map(k => {
				const sets = variableSets![k].sets;
				const setKeys = TypedObject.keys(sets);
				const value = selectedSets[k];

				return (
					<Item key={k}>
						<VariableSetName variableSetName={k} />

						<Selector
							value={value}
							onChange={e => {
								dispatch(editorPreferencesSetSelectedVariableSet({
									variableSet: k,
									setId: e.target.value,
								}));
							}}
						>
							{setKeys.map(gk => (
								<option key={gk} value={gk}>{sets[gk]}</option>
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

export default VariableSets;
