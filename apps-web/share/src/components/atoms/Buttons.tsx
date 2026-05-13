import styled, { css } from 'styled-components';

interface CtaButtonProps {
	$style: 'primary' | 'secondary' | 'tertiary';
}

const CtaButton = styled.a<CtaButtonProps>`
	display: inline-block;
	border-radius: 5px;
	color: var(--beak-colors-fg-onAccent);
	padding: 6px 10px;
	font-size: 14px;
	cursor: pointer;

	${p =>
		p.$style === 'primary' &&
		css`
		background: var(--beak-colors-accent-pink);

		&:hover {
			box-shadow: 0 0 20px 2px var(--beak-colors-accent-pink)99;
		}
	`}
	${p =>
		p.$style === 'secondary' &&
		css`
		background: var(--beak-colors-bg-surface);

		&:hover {
			box-shadow: 0 0 20px 2px var(--beak-colors-bg-surface)99;
		}
	`}
	${p =>
		p.$style === 'tertiary' &&
		css`
		background: var(--beak-colors-bg-canvas-alt);

		&:hover {
			box-shadow: 0 0 20px 2px var(--beak-colors-bg-canvas-alt)99;
		}
	`}

	text-decoration: none;
	transition: box-shadow .2s ease;
`;

export default CtaButton;
