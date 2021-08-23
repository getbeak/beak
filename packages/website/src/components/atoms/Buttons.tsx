import styled from 'styled-components';

const CtaButton = styled.a`
	display: block;
	border-radius: 5px;
	color: ${p => p.theme.ui.textOnAction};
	background: ${p => p.theme.ui.primaryFill};
	padding: 15px 40px;
	margin: 0 15px;
	font-size: 18px;

	text-decoration: none;

	transition: box-shadow .2s ease;

	&:hover {
		box-shadow: 0 0 20px 6px  rgba(212, 93, 128, 0.48);
	}

	@media (max-width: 676px) {
		font-size: 16px;
		padding: 10px 30px;
		margin: 0;
	}
`;

export default CtaButton;
