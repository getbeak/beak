import { faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface ArrowButtonProps {
	direction?: 'left' | 'right';
	onClick: () => void;
}

const ArrowButton: React.FC<React.PropsWithChildren<ArrowButtonProps>> = props => {
	const { direction = 'left', children, onClick } = props;
	const theme = useTheme();

	return (
		<Button onClick={onClick}>
			{direction === 'left' && (
				<FontAwesomeIcon icon={faAnglesLeft} color={'var(--beak-colors-fg-default)'} fontSize={'12px'} />
			)}
			<Children>{children}</Children>
			{direction === 'right' && <FontAwesomeIcon icon={faAnglesRight} color={'var(--beak-colors-fg-default)'} />}
		</Button>
	);
};

const Button = styled.button`
	display: flex;
	align-items: center;
	background: none;
	border: none;
	color: var(--beak-colors-fg-default);
	padding: 4px;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;

	&:hover {
		background: var(--beak-colors-accent-pink-muted);
	}
`;

const Children = styled.div`
	display: inline-block;
	margin: 0 5px;
`;

export default ArrowButton;
