import React from 'react';

import Container from '../components/atoms/Container';
import Footer from '../components/atoms/Footer';
import FooterLogo from '../components/atoms/FooterLogo';
import Navbar, { NavBrand, NavItemExternal, NavItemLocal, NavItems, NavLogo } from '../components/atoms/Navbar';
import useSmoothHashScroll from '../hooks/use-smooth-hash-scroll';

const AppContainer: React.FunctionComponent = ({ children }) => {
	useSmoothHashScroll();

	return (
		<React.Fragment>
			<Navbar>
				<Container>
					<NavBrand href={'/'}>
						<NavLogo />
						{'Beak'}
					</NavBrand>
					<NavItems>
						<NavItemLocal to={'/#features'}>
							{'Features'}
						</NavItemLocal>
						{window.location.host !== 'getbeak.app' && (
							<NavItemLocal to={'/pricing'}>
								{'Pricing'}
							</NavItemLocal>
						)}
						<NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://docs.getbeak.app'}
						>
							{'Docs'}
						</NavItemExternal>
						<NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://blog.getbeak.app'}
						>
							{'Blog'}
						</NavItemExternal>
						<NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://twitter.com/beakapp'}
						>
							{'Twitter'}
						</NavItemExternal>
					</NavItems>
				</Container>
			</Navbar>

			{children}

			<Footer>
				<Container>
					<span>{'Made with ❤️ in the UK'}</span>
					<FooterLogo />
				</Container>
			</Footer>
		</React.Fragment>
	);
}

export default AppContainer;
