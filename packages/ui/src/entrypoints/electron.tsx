import React from 'react';
import { init } from '@sentry/electron';

import Portal from '../containers/Portal';
import Preferences from '../containers/Preferences';
import ProjectMain from '../containers/ProjectMain';
import Welcome from '../containers/Welcome';

/* eslint-disable no-process-env */
if (import.meta.env.MODE !== 'development') {
	init({
		dsn: 'https://c7a8bd8013242cfe728beeaae8a3e9f1@o988021.ingest.sentry.io/4506451600670720',
		environment: import.meta.env.ENVIRONMENT,
		release: import.meta.env.RELEASE_IDENTIFIER,
	});
}
/* eslint-enable no-process-env */

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

export const ElectronEntrypoint: React.FC = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container')!;
	const component = getComponent(container);

	return component;
};
