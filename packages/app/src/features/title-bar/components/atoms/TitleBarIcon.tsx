import styled from 'styled-components';

const TitleBarIcon = styled.button`
	border: none;
	border-radius: 4px;
	padding: 0px 8px;
	height: 25px;
	background: none;

	&:hover:not(:disabled) {
		background: ${p => p.theme.ui.surface};
	}
	&:disabled {
		opacity: 0.5;
	}
	&:focus {
		outline: 0;
	}
`;

export default TitleBarIcon;
