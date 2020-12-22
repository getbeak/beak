import styled from 'styled-components';

const Input = styled.input`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-radius: 4px;
	padding: 3px 5px;
	width: 100%;
	box-sizing: border-box;
	font-size: 15px;
`;

export const InputInvalidText = styled.span`
	display: block;
	padding: 1px 0;
	font-size: 13px;
	font-weight: bold;
	color: ${p => p.theme.ui.destructiveAction};
`;

export default Input;
