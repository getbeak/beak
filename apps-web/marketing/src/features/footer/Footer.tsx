import { Box, Flex, Heading, Link, SimpleGrid, Text } from '@chakra-ui/react';
import type React from 'react';

import { SmallContainer } from '../../components/Container';

const FooterBrand: React.FC = () => (
	<Box>
		<Box
			backgroundImage="url('/assets/logo.svg')"
			backgroundSize='contain'
			backgroundPosition='left center'
			backgroundRepeat='no-repeat'
			mb='30px'
			h='25px'
			w='80px'
		/>
		<Text fontSize='14px' color='textMinor'>{`© 2021-${new Date().getFullYear()} Flamingo Corp Ltd.`}</Text>
		<Text fontSize='14px' color='textMinor'>
			Made with ❤️ in Amsterdam
		</Text>
	</Box>
);

const LinkHeader: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Heading as='h4' fontSize='18px' fontWeight={600} mb='10px'>
		{children}
	</Heading>
);

const FooterLink: React.FC<React.PropsWithChildren<{ href: string; external?: boolean }>> = ({
	href,
	external,
	children,
}) => (
	<Link
		href={href}
		display='block'
		fontSize='14px'
		lineHeight='25px'
		textDecoration='none'
		color='textMinor'
		_hover={{ textDecoration: 'underline' }}
		{...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
	>
		{children}
	</Link>
);

const FooterLinks: React.FC = () => (
	<SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: '35px', md: '50px' }} mt={{ base: '35px', md: 0 }}>
		<Box>
			<LinkHeader>Beak</LinkHeader>
			<FooterLink href='/#features'>Features</FooterLink>
			<FooterLink href='https://docs.getbeak.app/' external>
				Docs
			</FooterLink>
			<FooterLink href='https://status.getbeak.app/' external>
				Status
			</FooterLink>
		</Box>
		<Box>
			<LinkHeader>Legals</LinkHeader>
			<FooterLink href='/legal/terms'>Terms</FooterLink>
			<FooterLink href='/legal/privacy'>Privacy</FooterLink>
		</Box>
		<Box>
			<LinkHeader>Contact</LinkHeader>
			<FooterLink href='mailto:info@getbeak.app' external>
				Email
			</FooterLink>
			<FooterLink href='https://twitter.com/beakapp' external>
				Twitter
			</FooterLink>
		</Box>
	</SimpleGrid>
);

const Footer: React.FC = () => (
	<Box as='footer' mt='120px' bg='background'>
		<SmallContainer>
			<Flex flexDir={{ base: 'column', md: 'row' }} justifyContent='space-between' py={{ base: '50px', md: '90px' }}>
				<FooterBrand />
				<FooterLinks />
			</Flex>
		</SmallContainer>
	</Box>
);

export default Footer;
