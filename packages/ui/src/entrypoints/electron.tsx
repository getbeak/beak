import { init } from '@sentry/electron';
import React from 'react';

import ErrorBoundary from '../components/molecules/ErrorBoundary';
import Portal from '../containers/Portal';
import Preferences from '../containers/Preferences';
import ProjectMain from '../containers/ProjectMain';

if (import.meta.env.MODE !== 'development') {
	init({
		dsn: 'https://c7a8bd8013242cfe728beeaae8a3e9f1@o988021.ingest.sentry.io/4506451600670720',
		environment: import.meta.env.ENVIRONMENT,
		release: import.meta.env.RELEASE_IDENTIFIER,
	});
}

function getComponent(container: string | null): { node: React.ReactNode; label: string } {
	switch (container) {
		case 'project-main':
			return { node: <ProjectMain />, label: 'Project window' };

		case 'preferences':
			return { node: <Preferences />, label: 'Preferences' };

		case 'portal':
			return { node: <Portal />, label: 'Shared collection' };

		default:
			return { node: <span>{'unknown'}</span>, label: 'Window' };
	}
}

export const ElectronEntrypoint: React.FC = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container')!;
	const { node, label } = getComponent(container);

	return (
		<ErrorBoundary variant='full' label={label} resetKeys={[container]}>
			{node}
		</ErrorBoundary>
	);
};
