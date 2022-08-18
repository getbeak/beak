import styled from 'styled-components';

interface InputProps {
	beakSize?: 'sm' | 'md';
	$noStretch?: boolean;
}

const Input = styled.input<InputProps>`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textMinor};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	box-sizing: border-box;

	font-size: ${p => (p.beakSize || 'md') === 'md' ? '15px' : '13px'};
	padding: ${p => (p.beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px'};
	border-radius: ${p => (p.beakSize || 'md') === 'md' ? '4px' : '3px'};

	${p => !p.$noStretch && 'width: 100%;'}
`;

export const Select = styled.select<InputProps>`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textMinor};
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	box-sizing: border-box;

	font-size: ${p => (p.beakSize || 'md') === 'md' ? '15px' : '13px'};
	padding: ${p => (p.beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px'};
	border-radius: ${p => (p.beakSize || 'md') === 'md' ? '4px' : '3px'};

	${p => !p.$noStretch && 'width: 100%;'}
	${p => p.$noStretch && 'width: fit-content;'}

	&:active:not(:disabled) {
		border: 1px solid ${p => p.theme.ui.primaryFill};
	}
`;

export const InputInvalidText = styled.span`
	display: block;
	padding: 1px 0;
	font-size: 13px;
	font-weight: bold;
	color: ${p => p.theme.ui.destructiveAction};
`;

export default Input;
