import { Box, Link, useToken } from '@chakra-ui/react';
import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface LegalTitleProps {
	element: 'h2' | 'h3';
	id: string;
}

const LegalTitleItem: React.FC<React.PropsWithChildren<LegalTitleProps>> = ({ element, id, children }) => {
	const [primaryFill] = useToken('colors', ['primaryFill']);

	return (
		<Box as={element} position='relative' fontWeight={600} css={{ '&:hover > a': { opacity: 1 } }}>
			<Box position='absolute' top='-100px' visibility='hidden' id={id} />

			{children}

			<Link href={`#${id}`} display='inline-block' ml='8px' opacity={0} cursor='pointer' transition='opacity .2s ease'>
				<FontAwesomeIcon icon={faLink} color={primaryFill} size='1x' />
			</Link>
		</Box>
	);
};

export const LegalTitle: React.FC<React.PropsWithChildren<Omit<LegalTitleProps, 'element'>>> = ({ id, children }) => (
	<LegalTitleItem element='h2' id={id}>
		{children}
	</LegalTitleItem>
);

export const LegalSubTitle: React.FC<React.PropsWithChildren<Omit<LegalTitleProps, 'element'>>> = ({
	id,
	children,
}) => (
	<LegalTitleItem element='h3' id={id}>
		{children}
	</LegalTitleItem>
);
