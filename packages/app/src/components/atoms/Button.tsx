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

const destructiveCss = css`
	background: ${props => props.theme.ui.background};
	border: 2px solid ${props => props.theme.ui.destructiveAction};

	&:not(:disabled) {
		&:hover {
			background: ${props => props.theme.ui.destructiveAction};
		}

		&:focus {
			border-color: ${props => props.theme.ui.destructiveAction};
		}
	}
`;

const mdCss = css`
	padding: 5px 10px;
	font-size: 14px;
`;

const smCss = css`
	padding: 4px 8px;
	font-size: 13px;
`;

export interface ButtonProps {
	colour?: 'primary' | 'secondary' | 'destructive';
	size?: 'md' | 'sm';
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
		if (colour === 'destructive')
			return destructiveCss;

		return '';
	}}

	${({ size }) => {
		if (size === 'sm')
			return smCss;

		if (!size || size === 'md')
			return mdCss;

		return '';
	}}
`;

export default Button;
