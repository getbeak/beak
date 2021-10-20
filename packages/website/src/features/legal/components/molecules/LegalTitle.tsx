import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface LegalTitleProps {
	id: string;
}

const LegalTitle: React.FunctionComponent<LegalTitleProps> = ({ id, children }) => {
	const theme = useTheme();
	const url = `${window.location.pathname}#${id}`;

	return (
		<Wrapper id={id}>
			{children}

			<Clicker to={url}>
				<FontAwesomeIcon
					icon={faLink}
					color={theme.ui.primaryFill}
					size={'1x'}
				/>
			</Clicker>
		</Wrapper>
	);
};

const Clicker = styled(Link)`
	display: inline-block;
	margin-left: 8px;
	opacity: 0;
	cursor: pointer;

	transition: opacity .2s ease;
`;

const Wrapper = styled.h2`
	font-size: 25px;
	font-weight: 600;

	&:hover {
		> ${Clicker} {
			opacity: 1;
		}
	}
`;

export default LegalTitle;
