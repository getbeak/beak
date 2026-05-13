import { Flex } from '@chakra-ui/react';
import { Select } from '@beak/ui/components/atoms/Input';
import * as React from 'react';

interface PrettyRenderSelectionProps {
	selectedLanguage: string | null;
	onSelectedLanguageChange: (lang: string) => void;
}

const PrettyRenderSelection: React.FC<PrettyRenderSelectionProps> = ({
	selectedLanguage,
	onSelectedLanguageChange,
}) => (
	<Flex
		align='stretch'
		px='2.5'
		py='1.5'
		bg='bg.surface'
		borderBottomWidth='1px'
		borderColor='border.default'
		fontSize='lg'
	>
		<Select
			$beakSize='sm'
			value={selectedLanguage ?? 'text/plain'}
			onChange={e => onSelectedLanguageChange(e.currentTarget.value)}
		>
			<optgroup label='Basic'>
				<option value='txt'>{'Text'}</option>
			</optgroup>
			<optgroup label='Rich'>
				<option value='json+viewer'>{'JSON tree'}</option>
				<option value='json'>{'JSON (raw)'}</option>
				<option value='xml'>{'XML'}</option>
				<option value='html'>{'HTML'}</option>
				<option value='css'>{'CSS'}</option>
			</optgroup>
			<optgroup label='Media'>
				<option value='image'>{'Image'}</option>
				<option value='video'>{'Video'}</option>
			</optgroup>
			<optgroup label='Other'>
				<option disabled>{'Web'}</option>
				<option value='hex'>{'Hex'}</option>
			</optgroup>
		</Select>
	</Flex>
);

export default PrettyRenderSelection;
