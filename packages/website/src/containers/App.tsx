import React from 'react';

import Container from '../components/atoms/Container';
import Navbar, { NavBrand, NavItem,NavItems, NavLogo } from '../components/atoms/Navbar';

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
					<NavItem href={'mailto:info@getbeak.app'}>
						{'Support'}
					</NavItem>
					<NavItem href={'https://twitter.com/beakapp'}>
						{'Tiwtter'}
					</NavItem>
				</NavItems>
			</Container>
		</Navbar>
		{children}
		<footer>
			{'footer'}
		</footer>
	</React.Fragment>
);

export default AppContainer;
