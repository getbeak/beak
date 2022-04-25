import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { DesignSystemProvider } from '@beak/design-system';
import { init } from '@sentry/electron';

import NonprodBadge from './components/atoms/NonprodBadge';
import Portal from './containers/Portal';
import Preferences from './containers/Preferences';
import ProjectMain from './containers/ProjectMain';
import Welcome from './containers/Welcome';
import WindowSessionContext, { instance } from './contexts/window-session-context';
import { GlobalStyle } from './design-system';
import Arbiter from './features/arbiter/components/Arbiter';
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

const FauxRouter: React.FC<React.PropsWithChildren<unknown>> = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container');
	const component = getComponent(container);

	return (
		<Provider store={configureStore()}>
			<base href={'./'} />
			<WindowSessionContext.Provider value={instance}>
				<DesignSystemProvider themeKey={'dark'}>
					<GlobalStyle $darwin={instance.isDarwin()} />
					{container === 'portal' && component}
					{container !== 'portal' && (
						<Arbiter>
							{component}
						</Arbiter>
					)}
					<NonprodBadge />
				</DesignSystemProvider>
			</WindowSessionContext.Provider>
		</Provider>
	);
};

createRoot(document.getElementById('root')!).render(<FauxRouter />);
