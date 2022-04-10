import styled, { css } from 'styled-components';

interface CtaButtonProps {
	$style: 'primary' | 'secondary' | 'tertiary';
}

const CtaButton = styled.a<CtaButtonProps>`
	display: inline-block;
	border-radius: 5px;
	color: ${p => p.theme.ui.textOnAction};
	padding: 6px 10px;
	font-size: 14px;
	cursor: pointer;

	${p => p.$style === 'primary' && css`
		background: ${p.theme.ui.primaryFill};

		&:hover {
			box-shadow: 0 0 20px 2px ${p.theme.ui.primaryFill}99;
		}
	`}
	${p => p.$style === 'secondary' && css`
		background: ${p.theme.ui.surfaceFill};

		&:hover {
			box-shadow: 0 0 20px 2px ${p.theme.ui.surfaceFill}99;
		}
	`}
	${p => p.$style === 'tertiary' && css`
		background: ${p.theme.ui.secondaryBackground};

		&:hover {
			box-shadow: 0 0 20px 2px ${p.theme.ui.secondaryBackground}99;
		}
	`}

	text-decoration: none;
	transition: box-shadow .2s ease;
`;

export default CtaButton;
