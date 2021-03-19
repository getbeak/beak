import styled from 'styled-components';

const CtaButton = styled.a`
	border-radius: 5px;
	color: ${p => p.theme.ui.textOnAction};
	background: ${p => p.theme.ui.primaryFill};
	padding: 15px 40px;
	font-size: 18px;

	text-decoration: none;

	opacity: 0.9;
	transition: box-shadow .2s ease;

	&:hover {
		box-shadow: 0 0 20px 6px  rgba(212, 93, 128, 0.48);
	}
`;

export default CtaButton;
