import { Box, Flex, IconButton, Link } from '@chakra-ui/react';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';

import Container from './Container';

const NavLink: React.FC<React.PropsWithChildren<{ href: string; external?: boolean }>> = ({
	href,
	external,
	children,
}) => (
	<Link
		href={href}
		px='10px'
		py='5px'
		mx='8px'
		fontSize='14px'
		color='textOnSurfaceBackground'
		textDecoration='none'
		transition='color .2s ease'
		_hover={{ color: 'textOnSurfaceBackground', textDecoration: 'none' }}
		{...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
		css={{
			'@media (max-width: 676px)': {
				display: 'block',
				background: 'var(--chakra-colors-background)',
				color: 'var(--chakra-colors-textOnSurfaceBackground)',
				marginBottom: '10px',
				padding: '10px',
				fontWeight: 700,
				textAlign: 'center',
				borderRadius: '10px',
				'&:hover': { color: 'var(--chakra-colors-textMinor)' },
			},
		}}
	>
		{children}
	</Link>
);

const Navbar: React.FC = () => {
	const [expanded, setExpanded] = useState(false);

	return (
		<Box
			as='nav'
			position='sticky'
			top={0}
			w='100%'
			py='25px'
			zIndex={101}
			backdropFilter='blur(10px)'
			bg='surface'
			borderBottom='1px solid'
			borderColor='backgroundBorderSeparator'
		>
			<Container>
				<Flex
					justifyContent={{ base: 'space-between', md: 'initial' }}
					css={{
						display: 'flex',
						'@media (min-width: 677px)': {
							display: 'grid',
							gridTemplateColumns: '120px 1fr 120px',
							gridTemplateRows: '1fr',
						},
					}}
				>
					<Link
						href='/'
						display='flex'
						flexDir='row'
						alignItems='center'
						textTransform='uppercase'
						fontWeight={600}
						fontSize='22px'
						lineHeight='24px'
						color='textOnSurfaceBackground'
						textDecoration='none'
						_hover={{ textDecoration: 'none' }}
						css={{ gridColumn: 1, gridRow: 1 }}
					>
						<Box
							display='inline-block'
							bgImage="url('/assets/logo.svg')"
							bgRepeat='no-repeat'
							bgSize='contain'
							w='43px'
							h='26px'
							mr='15px'
						/>
						Beak
					</Link>

					<Box
						onMouseDown={(event: React.MouseEvent) => {
							if ((event.target as HTMLElement).nodeName === 'A') setExpanded(false);
						}}
						css={{
							gridColumn: 2,
							gridRow: 1,
							margin: '0 auto',
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-evenly',
							'@media (max-width: 676px)': {
								display: 'block',
								pointerEvents: expanded ? 'all' : 'none',
								opacity: expanded ? 1 : 0,
								transform: expanded ? 'rotateX(0deg)' : 'rotateX(-30deg)',
								transformOrigin: '0 0',
								transformStyle: 'preserve-3d',
								position: 'absolute',
								top: '77px',
								left: 0,
								right: 0,
								flexDirection: 'column',
								paddingLeft: '20px',
								paddingRight: '20px',
								paddingTop: '20px',
								paddingBottom: '10px',
								borderBottom: '1px solid var(--chakra-colors-backgroundBorderSeparator)',
								background: 'var(--chakra-colors-secondaryBackground)',
								backdropFilter: 'blur(20px)',
								transition: 'opacity .3s ease, transform .3s ease',
							},
						}}
					>
						<NavLink href='/#features'>Features</NavLink>
						<NavLink href='https://docs.getbeak.app' external>
							Docs
						</NavLink>
						<NavLink href='https://twitter.com/beakapp' external>
							Twitter
						</NavLink>
					</Box>

					<IconButton
						aria-label='Toggle dropdown navbar'
						bg='textOnSurfaceBackground'
						color='background'
						border='none'
						borderRadius='4px'
						w='40px'
						h='40px'
						cursor='pointer'
						onClick={() => setExpanded(e => !e)}
						css={{
							display: 'none',
							'@media (max-width: 676px)': { display: 'inline-flex' },
						}}
					>
						<FontAwesomeIcon icon={faBars} />
					</IconButton>
				</Flex>
			</Container>
		</Box>
	);
};

export default Navbar;
