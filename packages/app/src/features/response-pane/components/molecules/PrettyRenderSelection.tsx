import React from 'react';
import { Select } from '@beak/app/components/atoms/Input';
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
			<Label>
				{'Auto detect: '}
				<input type={'checkbox'} checked={autoDetect} onChange={onAutoDetectToggle} />
			</Label>
			<Spacer />
			<Select
				disabled={autoDetect}
				beakSize={'sm'}
				value={selectedLanguage ?? 'text/plain'}
				onChange={e => onSelectedLanguageChange(e.currentTarget.value)}
			>
				{/* These values use the mime-type extension */}
				<option value={'txt'}>{'Text'}</option>
				<option disabled>{'_________'}</option>
				<option value={'json'}>{'JSON'}</option>
				<option disabled value={'json+viewer'}>{'JSON viewer'}</option>
				<option value={'xml'}>{'XML'}</option>
				<option value={'html'}>{'HTML'}</option>
				<option value={'css'}>{'CSS'}</option>
				<option disabled>{'_________'}</option>
				<option disabled>{'Image'}</option>
				<option disabled>{'Video'}</option>
				<option disabled>{'_________'}</option>
				<option disabled>{'Web'}</option>
			</Select>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	align-items: stretch;
	padding: 5px 10px;

	background: ${p => p.theme.ui.surface};
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-left-width: 0;
	border-right-width: 0;

	font-size: 14px;
`;

const Label = styled.div`
	display: inline-flex;
	white-space: nowrap;
	font-size: 12px;
	align-items: center;
`;

const Spacer = styled.div`
	margin: 3px;
	margin-left: 8px;
	margin-right: 11px;
	width: 1px;
	background: ${p => p.theme.ui.backgroundBorderSeparator};
`;

export default PrettyRenderSelection;
