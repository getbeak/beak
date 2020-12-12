import styled, { css } from 'styled-components';

const primaryCss = css`
	background: ${props => props.theme.ui.background};
	border: 2px solid ${props => props.theme.ui.primaryFill};

	&:not(:disabled) {
		&:hover {
			background: ${props => props.theme.ui.primaryFill};
		}

		&:focus {
			border-color: ${props => props.theme.ui.primaryFill};
		}
	}
`;

const secondaryCss = css`
	background: ${props => props.theme.ui.background};
	border: 2px solid ${props => props.theme.ui.secondaryAction};

	&:not(:disabled) {
		&:hover {
			background: ${props => props.theme.ui.secondaryAction};
		}

		&:focus {
			border-color: ${props => props.theme.ui.secondaryAction};
		}
	}
`;

const mdCss = css`
	padding: 5px 10px;
	font-size: 14px;
`;

export interface ButtonProps {
	colour?: 'primary' | 'secondary';
	size?: 'md';
}

const Button = styled.button<ButtonProps>`
	border-radius: 4px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	transition: transform ease .1s;
	cursor: pointer;

	&:disabled {
		opacity: .7;
		cursor: default;
	}

	&:not(:disabled) {
		&:active {
			transform: scale(.95);
		}

		&:focus {
			outline: none;
		}
	}

	${({ colour }) => {
		if (colour === 'primary')
			return primaryCss;
		if (!colour || colour === 'secondary')
			return secondaryCss;

		return '';
	}}

	${({ size }) => {
		if (!size || size === 'md')
			return mdCss;

		return '';
	}}
`;

export default Button;
