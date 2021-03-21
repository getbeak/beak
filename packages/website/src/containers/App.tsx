import React from 'react';

import Container from '../components/atoms/Container';
import Footer from '../components/atoms/Footer';
import FooterLogo from '../components/atoms/FooterLogo';
import Navbar, { NavBrand, NavItem, NavItems, NavLogo } from '../components/atoms/Navbar';

const AppContainer: React.FunctionComponent = ({ children }) => (
	<React.Fragment>
		<Navbar>
			<Container>
				<NavBrand>
					<NavLogo />
					{'Beak'}
				</NavBrand>
				<NavItems>
					<NavItem href={'#features'}>
						{'Features'}
					</NavItem>
					<NavItem href={'https://docs.getbeak.app'}>
						{'Docs'}
					</NavItem>
					<NavItem href={'https://blog.getbeak.app'}>
						{'Blog'}
					</NavItem>
					<NavItem href={'https://twitter.com/beakapp'}>
						{'Twitter'}
					</NavItem>
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

export default AppContainer;
