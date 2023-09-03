import React from 'react';
import { Select } from '@beak/ui/components/atoms/Input';
import styled from 'styled-components';

interface PrettyRenderSelectionProps {
	selectedLanguage: string | null;
	onSelectedLanguageChange: (lang: string) => void;
}

const PrettyRenderSelection: React.FC<React.PropsWithChildren<PrettyRenderSelectionProps>> = props => {
	const { selectedLanguage, onSelectedLanguageChange } = props;

	return (
		<Container>
			<Select
				beakSize={'sm'}
				value={selectedLanguage ?? 'text/plain'}
				onChange={e => onSelectedLanguageChange(e.currentTarget.value)}
			>
				<optgroup label={'Basic'}>
					<option value={'txt'}>{'Text'}</option>
				</optgroup>
				<optgroup label={'Rich'}>
					<option value={'json'}>{'JSON'}</option>
					<option disabled value={'json+viewer'}>{'JSON viewer'}</option>
					<option value={'xml'}>{'XML'}</option>
					<option value={'html'}>{'HTML'}</option>
					<option value={'css'}>{'CSS'}</option>
				</optgroup>
				<optgroup label={'Media'}>
					<option value={'image'}>{'Image'}</option>
					<option value={'video'}>{'Video'}</option>
				</optgroup>
				<optgroup label={'Other'}>
					<option disabled>{'Web'}</option>
					<option value={'hex'}>{'Hex'}</option>
				</optgroup>
			</Select>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	align-items: stretch;
	padding: 5px 10px;

	background: ${p => p.theme.ui.surface};
	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};

	font-size: 14px;
`;

export default PrettyRenderSelection;
