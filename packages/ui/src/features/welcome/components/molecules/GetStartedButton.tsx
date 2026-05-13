import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Maps the previous design-system colour-token names that callers pass into
 *  `iconColor` onto Chakra CSS vars so the icon still picks up the brand
 *  palette via the active theme.  Unknown keys fall through to `undefined`. */
const ICON_COLOUR_TOKEN_MAP: Record<string, string> = {
	primaryFill: 'var(--beak-colors-accent-pink)',
	secondaryFill: 'var(--beak-colors-accent-indigo)',
	tertiaryFill: 'var(--beak-colors-accent-teal)',
	goAction: 'var(--beak-colors-accent-teal)',
	secondaryAction: 'var(--beak-colors-accent-pink)',
	destructiveAction: 'var(--beak-colors-accent-alert)',
	textHighlight: 'var(--beak-colors-accent-pink)',
	textSuccess: 'var(--beak-colors-accent-teal)',
	textAlert: 'var(--beak-colors-accent-alert)',
};

export interface GetStartedButtonProps extends ButtonProps {
	title: string;
	description: string;
	icon: IconDefinition;
	iconColor?: keyof typeof ICON_COLOUR_TOKEN_MAP;
}

const GetStartedButton: React.FC<React.PropsWithChildren<GetStartedButtonProps>> = props => {
	const { title, description, icon, iconColor, ...passProps } = props;

	const color = iconColor ? ICON_COLOUR_TOKEN_MAP[iconColor] : void 0;

	return (
		<Button {...passProps}>
			<Container>
				<Icon>
					<FontAwesomeIcon icon={icon} color={color} size={'2x'} />
				</Icon>
				<TextParts>
					<Title>{title}</Title>
					<Description>{description}</Description>
				</TextParts>
			</Container>
		</Button>
	);
};

const Button = styled.button`
	display: block;
	width: calc(100% - 20px);
	background: color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent);
	backdrop-filter: blur(5px);
	border-radius: 5px;
	color: var(--beak-colors-fg-default);
	border: none;
	cursor: pointer;

	padding: 10px;
	margin-bottom: 10px;

	transition: transform ease .1s;

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	&:not(:disabled) {
		&:hover {
			background: var(--beak-colors-bg-surface-alt);
		}

		&:active, &:focus {
			background: var(--beak-colors-bg-canvas);
			transform: scale(0.98);
			outline: 0;
		}
	}
`;

const Container = styled.div`
	display: flex;
`;

const Icon = styled.div`
	display: flex;
	width: 40px;

	align-items: center;
	justify-content: center;
`;

const TextParts = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	margin-left: 10px;
`;

const Title = styled.span`
	font-size: 19px;
	font-weight: 300;
`;

const Description = styled.span`
	font-size: 13px;
	color: var(--beak-colors-fg-muted);
`;

export default GetStartedButton;
