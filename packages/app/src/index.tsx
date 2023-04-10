import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Theme } from '@beak/common/types/theme';
import { DesignSystemProvider } from '@beak/design-system';
import { init } from '@sentry/electron';

import './utils/unhandled-error-handler';
import NonprodBadge from './components/atoms/NonprodBadge';
import Tooltips from './components/molecules/Tooltips';
import Portal from './containers/Portal';
import Preferences from './containers/Preferences';
import ProjectMain from './containers/ProjectMain';
import Welcome from './containers/Welcome';
import WindowSessionContext, { instance } from './contexts/window-session-context';
import { GlobalStyle } from './design-system';
import ArbiterOverlayBadge from './features/arbiter/components/ArbiterOverlayBadge';
import { configureStore } from './store';
import { setupMonaco } from './utils/monaco';

/* eslint-disable no-process-env */
if (import.meta.env.MODE !== 'development') {
	init({
		dsn: 'https://5118444e09d74b03a320d0e604aa68ff@o988021.ingest.sentry.io/5945114',
		environment: import.meta.env.ENVIRONMENT,
		release: import.meta.env.RELEASE_IDENTIFIER,
	});
}
/* eslint-enable no-process-env */

const store = configureStore();

setupMonaco();

function getComponent(container: string | null) {
	switch (container) {
		case 'welcome':
			return <Welcome />;

		case 'project-main':
			return <ProjectMain />;

		case 'preferences':
			return <Preferences />;

		case 'portal':
			return <Portal />;

		default:
			return <span>{'unknown'}</span>;
	}
}

function getSystemTheme(): Theme {
	let theme: Theme = 'light';

	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
		theme = 'dark';

	return theme;
}

const FauxRouter: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [theme, setTheme] = useState<Theme>(getSystemTheme());
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container')!;
	const component = getComponent(container);

	useEffect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			setTheme(event.matches ? 'dark' : 'light');
		});
	}, []);

	return (
		<Provider store={store}>
			<base href={'./'} />
			<WindowSessionContext.Provider value={instance}>
				<DesignSystemProvider themeKey={theme}>
					<GlobalStyle $darwin={instance.isDarwin()} />
					{component}
					{!['portal', 'project-main'].includes(container) && <ArbiterOverlayBadge />}
					<NonprodBadge />
					<Tooltips />
				</DesignSystemProvider>
			</WindowSessionContext.Provider>
		</Provider>
	);
};

createRoot(document.getElementById('root')!).render(<FauxRouter />);
