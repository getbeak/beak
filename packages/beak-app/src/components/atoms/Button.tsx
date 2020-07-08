import styled, { css } from 'styled-components';

const primaryCss = css`
	background: ${props => props.theme.ui.background};
	border: 2px solid ${props => props.theme.ui.primaryFill};

	&:not(:disabled) {
		&:hover {
			background: ${props => props.theme.ui.secondaryBackground};
		}
	}
`;

const mdCss = css`
	padding: 5px 10px;
	font-size: 14px;
`;

export interface ButtonProps {
	color: 'primary' | 'secondary' | 'action' | 'alert';
	size: 'md';
}

const Button = styled.button<ButtonProps>`
	border-radius: none;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	transition: transform ease .1s;

	&:disabled {
		opacity: .7;
	}

	&:not(:disabled) {
		&:active {
			transform: scale(.95);
		}
	}

	${({ color }) => {
		if (color === 'primary')
			return primaryCss;

		return '';
	}}

	${({ size }) => {
		if (size === 'md')
			return mdCss;

		return '';
	}}
`;

Button.defaultProps = {
	color: 'primary',
	size: 'md',
};

export default Button;
