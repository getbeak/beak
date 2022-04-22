import React from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

interface ActionIconButtonProps extends React.HTMLProps<HTMLButtonElement> {
	icon: IconProp;
}

const ActionIconButton: React.FunctionComponent<React.PropsWithChildren<ActionIconButtonProps>> = props => {
	const { icon, ...buttonProps } = props;

	return (
		// @ts-ignore
		<Button {...buttonProps}>
			<FontAwesomeIcon icon={icon} />
		</Button>
	);
};

const Button = styled.button`
	width: 15px; height: 15px;
	text-align: center;
	margin-right: 5px;
	padding: 0;

	background: none;
	border: 1px solid ${p => p.theme.ui.textMinor};
	color: ${p => p.theme.ui.textMinor};
	border-radius: 100%;
	line-height: 15px;

	box-shadow: 0 0 1px 0px white inset, 0 0 1px 0px white;

	font-size: 8px;
`;

export default ActionIconButton;
