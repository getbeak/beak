import React from 'react';
import { faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

interface ArrowButtonProps {
	direction?: 'left' | 'right';
	onClick: () => void;
}

const ArrowButton: React.FunctionComponent<ArrowButtonProps> = props => {
	const { direction = 'left', children, onClick } = props;
	const theme = useTheme();

	return (
		<Button onClick={onClick}>
			{direction === 'left' && (
				<FontAwesomeIcon
					icon={faAnglesLeft}
					color={theme.ui.textOnSurfaceBackground}
					fontSize={'12px'}
				/>
			)}
			<Children>{children}</Children>
			{direction === 'right' && (
				<FontAwesomeIcon
					icon={faAnglesRight}
					color={theme.ui.textOnSurfaceBackground}
				/>
			)}
		</Button>
	);
};

const Button = styled.button`
	display: flex;
	align-items: center;
	background: none;
	border: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	padding: 4px;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;

	&:hover {
		background: ${p => p.theme.ui.secondaryActionMuted};
	}
`;

const Children = styled.div`
	display: inline-block;
	margin: 0 5px;
`;

export default ArrowButton;
