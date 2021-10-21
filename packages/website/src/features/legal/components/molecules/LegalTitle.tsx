import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface LegalTitleProps {
	element: 'h2' | 'h3';
	id: string;
}

const LegalTitleItem: React.FunctionComponent<LegalTitleProps> = ({ element, id, children }) => {
	const theme = useTheme();
	const url = `${window.location.pathname}#${id}`;

	return (
		<Wrapper id={id} as={element}>
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

const Wrapper = styled.div`
	font-weight: 600;

	&:hover {
		> ${Clicker} {
			opacity: 1;
		}
	}
`;

export const LegalTitle: React.FunctionComponent<Omit<LegalTitleProps, 'element'>> = ({ id, children }) => (
	<LegalTitleItem element={'h2'} id={id}>{children}</LegalTitleItem>
);

export const LegalSubTitle: React.FunctionComponent<Omit<LegalTitleProps, 'element'>> = ({ id, children }) => (
	<LegalTitleItem element={'h3'} id={id}>{children}</LegalTitleItem>
);
