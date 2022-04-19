import styled from 'styled-components';

interface InputProps {
	beakSize?: 'sm' | 'md';
}

const Input = styled.input<InputProps>`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	width: 100%;
	box-sizing: border-box;

	font-size: ${p => (p.beakSize || 'md') === 'md' ? '15px' : '13px'};
	padding: ${p => (p.beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px'};
	border-radius: ${p => (p.beakSize || 'md') === 'md' ? '4px' : '2px'};
`;

export const Select = styled.select<InputProps>`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	width: 100%;
	box-sizing: border-box;

	font-size: ${p => (p.beakSize || 'md') === 'md' ? '15px' : '13px'};
	padding: ${p => (p.beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px'};
	border-radius: ${p => (p.beakSize || 'md') === 'md' ? '4px' : '3px'};
`;

export const InputInvalidText = styled.span`
	display: block;
	padding: 1px 0;
	font-size: 13px;
	font-weight: bold;
	color: ${p => p.theme.ui.destructiveAction};
`;

export default Input;
