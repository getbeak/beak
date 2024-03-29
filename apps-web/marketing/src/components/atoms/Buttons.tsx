import styled, { css } from 'styled-components';

interface CtaButtonProps {
	$style: 'primary' | 'secondary' | 'tertiary';
}

const CtaButton = styled.a<CtaButtonProps>`
	display: block;
	border-radius: 5px;
	color: ${p => p.theme.ui.textOnAction};
	padding: 10px 20px;
	margin: 0 15px;
	font-size: 16px;

	${p => p.$style === 'primary' && css`
		background: ${p.theme.ui.primaryFill};

		&:hover {
			box-shadow: 0 0 20px 6px ${p.theme.ui.primaryFill}99;
		}
	`}
	${p => p.$style === 'secondary' && css`
		background: ${p.theme.ui.secondarySurface};
		color: ${p => p.theme.ui.textOnFill};

		&:hover {
			box-shadow: 0 0 20px 6px ${p.theme.ui.secondarySurface}99;
		}
	`}
	${p => p.$style === 'tertiary' && css`
		background: ${p.theme.ui.surfaceHighlight};
		color: ${p => p.theme.ui.textOnFill};

		&:hover {
			box-shadow: 0 0 20px 6px ${p.theme.ui.surfaceHighlight}99;
		}
	`}

	text-decoration: none;
	transition: box-shadow .2s ease;

	@media (max-width: 676px) {
		font-size: 16px;
		padding: 10px 30px;
		margin: 0;
	}
`;

export default CtaButton;
