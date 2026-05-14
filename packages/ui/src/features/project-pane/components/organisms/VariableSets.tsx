import { Box, Grid } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import NoVariableSets from '../molecules/NoVariableSets';
import VariableSetName from '../molecules/VariableSetName';

const selectStyle: React.CSSProperties = {
	width: '100%',
	fontSize: '11px',
	fontWeight: 600,
	border: 0,
	borderRadius: '4px',
	background: 'none',
	color: 'var(--beak-colors-fg-default)',
	textAlignLast: 'right',
	textOverflow: 'ellipsis',
	cursor: 'pointer',
	appearance: 'none',
	WebkitAppearance: 'none',
	MozAppearance: 'none',
};

const VariableSets: React.FC = () => {
	const dispatch = useDispatch();
	const { variableSets } = useAppSelector(s => s.global.variableSets)!;
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const empty = Object.keys(variableSets).length === 0;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (empty) {
		return (
			<Box px='1.5' py='1' pr='0' pb='0'>
				<NoVariableSets />
			</Box>
		);
	}

	return (
		<Box px='1.5' py='1' pr='0' pb='0'>
			{TypedObject.keys(variableSets!).map(k => {
				const sets = variableSets![k].sets;
				const setKeys = TypedObject.keys(sets);
				const value = selectedSets[k];

				return (
					<Grid
						key={k}
						templateColumns='minmax(10px, max-content) minmax(10px, max-content)'
						justifyContent='space-between'
						alignItems='center'
						gap='1.5'
						my='1'
						maxW='calc(100% - 3px)'
						_first={{ mt: '0' }}
						_notLast={{ mb: '1.5' }}
					>
						<VariableSetName variableSetName={k} />
						<select
							value={value}
							style={selectStyle}
							onChange={e => {
								dispatch(editorPreferencesSetSelectedVariableGroup({
									variableSet: k,
									setId: e.target.value,
								}));
							}}
						>
							{setKeys.map(gk => (
								<option key={gk} value={gk}>{sets[gk]}</option>
							))}
						</select>
					</Grid>
				);
			})}
		</Box>
	);
};

export default VariableSets;
