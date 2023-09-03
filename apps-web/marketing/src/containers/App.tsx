import React, { useState } from 'react';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Container from '../components/atoms/Container';
import Navbar, {
	NavBrand,
	NavDropdown,
	NavItemExternal,
	NavItemLocal,
	NavItems,
	NavLogo,
} from '../components/atoms/Navbar';
import Footer from '../features/footer/components/Footer';
import useSmoothHashScroll from '../hooks/use-smooth-hash-scroll';

const AppContainer: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
	const [expandNav, setExpandNav] = useState(false);

	useSmoothHashScroll();

	return (
		<React.Fragment>
			<Navbar>
				<Container>
					<NavBrand href={'/'}>
						<NavLogo />
						{'Beak'}
					</NavBrand>
					<NavItems
						$expand={expandNav}
						onMouseDown={event => {
							if ((event.target as HTMLDivElement).nodeName !== 'A')
								return;

							setExpandNav(false);
						}}
					>
						<NavItemLocal to={'/#features'}>
							{'Features'}
						</NavItemLocal>
						<NavItemLocal to={'/pricing'}>
							{'Pricing'}
						</NavItemLocal>
						<NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://docs.getbeak.app'}
						>
							{'Docs'}
						</NavItemExternal>
						{/* <NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://blog.getbeak.app'}
						>
							{'Blog'}
						</NavItemExternal> */}
						<NavItemExternal
							target={'_blank'}
							rel={'noopener noreferrer nofollow'}
							href={'https://twitter.com/beakapp'}
						>
							{'Twitter'}
						</NavItemExternal>
					</NavItems>
					<NavDropdown onClick={() => setExpandNav(!expandNav)} aria-label={'Toggle dropdown navbar'}>
						<FontAwesomeIcon icon={faBars} />
					</NavDropdown>
				</Container>
			</Navbar>

			{children}

			<Footer />
		</React.Fragment>
	);
};

export default AppContainer;
