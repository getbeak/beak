import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, Stack, Text } from '@chakra-ui/react';
import React from 'react';

export interface Scenario {
	id: string;
	label: string;
	notes: string;
	parts: ValueSections;
	mask?: boolean;
}

interface ScenarioPickerProps {
	scenarios: Scenario[];
	selectedId: string;
	onSelect: (id: string) => void;
}

const ScenarioPicker: React.FC<ScenarioPickerProps> = ({ scenarios, selectedId, onSelect }) => (
	<Stack gap='0' py='2'>
		<Text
			px='4'
			pt='1'
			pb='2'
			fontSize='10px'
			fontWeight='700'
			color='fg.subtle'
			letterSpacing='0.08em'
			textTransform='uppercase'
		>
			{'Scenarios'}
		</Text>
		{scenarios.map(s => {
			const active = s.id === selectedId;
			return (
				<Box
					key={s.id}
					as='button'
					display='flex'
					flexDirection='column'
					alignItems='flex-start'
					textAlign='left'
					width='100%'
					px='4'
					py='2'
					gap='0.5'
					bg={active ? 'color-mix(in srgb, var(--beak-colors-accent-teal) 12%, transparent)' : 'transparent'}
					borderLeftWidth='2px'
					borderLeftColor={active ? 'accent.teal' : 'transparent'}
					_hover={{
						bg: active ? 'color-mix(in srgb, var(--beak-colors-accent-teal) 16%, transparent)' : 'bg.surface',
					}}
					onClick={() => onSelect(s.id)}
				>
					<Text fontSize='xs' fontWeight={active ? 600 : 500} color={active ? 'fg.default' : 'fg.muted'}>
						{s.label}
					</Text>
					<Box fontSize='10px' color='fg.subtle' lineHeight='1.3'>
						{s.notes}
					</Box>
				</Box>
			);
		})}
	</Stack>
);

export default ScenarioPicker;
