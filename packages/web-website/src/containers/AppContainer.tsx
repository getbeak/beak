import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { DesignSystemProvider } from '@beak/design-system';
import { Theme } from '@beak/design-system/types';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as Sentry from '@sentry/react';

import Container from '../components/atoms/Container';
import Navbar, {
	NavBrand,
	NavDropdown,
	NavItemExternal,
	NavItemLocal,
	NavItems,
	NavLogo,
} from '../components/atoms/Navbar';
import { GlobalStyle } from '../design-system';
import ErrorFallback from '../features/errors/components/ErrorFallback';
import Footer from '../features/footer/components/Footer';
import useSmoothHashScroll from '../hooks/use-smooth-hash-scroll';
import { configureStore } from '../store';

const store = configureStore();

function getSystemTheme(): Theme {
	let theme: Theme = 'light';

	// Assume dark during SSG
	if (typeof window === 'undefined')
		return 'light';

	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
		theme = 'dark';

	return theme;
}

const AppContainer: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
	const [expandNav, setExpandNav] = useState(false);
	const [theme, setTheme] = useState<Theme>(getSystemTheme());

	useSmoothHashScroll();

	useEffect(() => {
		if (typeof window === 'undefined')
			return;

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			setTheme(event.matches ? 'dark' : 'light');
		});
	}, []);

	return (
		<Provider store={store}>
			<base href={'./'} />
			<DesignSystemProvider themeKey={theme}>
				<GlobalStyle />
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

					<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
						{children}
					</Sentry.ErrorBoundary>

					<Footer />
				</React.Fragment>
			</DesignSystemProvider>
		</Provider>
	);
};

// if (import.meta.env.MODE !== 'development') {
// 	Sentry.init({
// 		dsn: 'https://8b49a1bc9c164490bbd0d7e564c92794@o988021.ingest.sentry.io/5948027',
// 		integrations: [new Integrations.BrowserTracing()],
// 		environment: import.meta.env.ENVIRONMENT,
// 		release: import.meta.env.RELEASE_IDENTIFIER,

// 		tracesSampleRate: 1.0,
// 	});
// }

export default AppContainer;
