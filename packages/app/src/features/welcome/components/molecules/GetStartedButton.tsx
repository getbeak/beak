import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export interface GetStartedButtonProps extends ButtonProps {
	title: string;
	description: string;
	icon: IconDefinition;
}

const GetStartedButton: React.FunctionComponent<GetStartedButtonProps> = props => {
	const {
		title,
		description,
		icon,
		...passProps
	} = props;

	return (
		<Button {...passProps}>
			<Container>
				<Icon>
					<FontAwesomeIcon
						icon={icon}
						size={'2x'}
					/>
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
	width: 100%;
	background: ${props => props.theme.ui.secondarySurface};
	color: ${props => props.theme.ui.textOnAction};
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
			background: ${props => props.theme.ui.surfaceHighlight};
		}

		&:focus {
			outline: 1px solid ${props => props.theme.ui.surfaceBorderSeparator};
		}

		&:active {
			background: ${props => props.theme.ui.background};
			transform: scale(0.99);
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
	color: ${props => props.theme.ui.textMinor};
`;

export default GetStartedButton;
