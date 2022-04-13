import React from 'react';
import styled from 'styled-components';

interface PrettyRenderSelectionProps {
	autoDetect: boolean;
	selectedLanguage: string | null;
	onAutoDetectToggle: () => void;
	onSelectedLanguageChange: (lang: string) => void;
}

const PrettyRenderSelection: React.FunctionComponent<PrettyRenderSelectionProps> = props => {
	const { autoDetect, selectedLanguage, onAutoDetectToggle, onSelectedLanguageChange } = props;

	return (
		<Container>
			<label>
				{'Auto detect?'}
				<input type={'checkbox'} checked={autoDetect} onChange={onAutoDetectToggle} />
			</label>
			<select
				disabled={autoDetect}
				value={selectedLanguage ?? 'text/plain'}
				onChange={e => onSelectedLanguageChange(e.currentTarget.value)}
			>
				<option value={'text/plain'}>{'Text'}</option>
				<option disabled>{'_________'}</option>
				<option value={'application/json'}>{'JSON'}</option>
				<option disabled value={'application/json+viewer'}>{'JSON viewer'}</option>
				<option value={'application/xml'}>{'XML'}</option>
				<option value={'text/html'}>{'HTML'}</option>
				<option value={'text/css'}>{'CSS'}</option>
				<option disabled>{'_________'}</option>
				<option disabled>{'Image'}</option>
				<option disabled>{'Video'}</option>
				<option disabled>{'_________'}</option>
				<option disabled>{'Web'}</option>
			</select>
		</Container>
	);
};

const Container = styled.div`
	padding: 5px;
	background: ${p => p.theme.ui.surface};
	border-bottom: 2px solid ${p => p.theme.ui.backgroundBorderSeparator};

	font-size: 14px;
`;

export default PrettyRenderSelection;
