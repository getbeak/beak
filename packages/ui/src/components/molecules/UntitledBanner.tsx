import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import styled from 'styled-components';

import { ipcProjectService } from '../../lib/ipc';

/**
 * Renders a thin strip at the top of a project window when the active
 * project is an untitled scratch project (created in
 * userData/untitled-projects/). The CTA fires the same IPC as the
 * application menu's "Save Project As…" item — promoteUntitled — which
 * moves the folder to the user-chosen location and re-opens the window.
 *
 * Returns null for non-untitled projects so production projects pay no
 * layout cost.
 */
const UntitledBanner: React.FC = () => {
	const untitled = useAppSelector(s => Boolean(s.global.project.untitled));

	if (!untitled) return null;

	async function onSaveAs() {
		try {
			await ipcProjectService.promoteUntitled({});
		} catch (err) {
			// Dialog surface lives host-side; renderer just logs.
			console.warn('Save Project As… failed', err);
		}
	}

	return (
		<Bar role={'status'} aria-label={'untitled-project'}>
			<Message>
				<strong>{'Untitled project.'}</strong>
				{' Your changes are live but in a temporary folder. Save the project to keep it.'}
			</Message>
			<SaveAsButton type={'button'} onClick={onSaveAs}>
				{'Save Project As…'}
			</SaveAsButton>
		</Bar>
	);
};

const Bar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 6px 12px;
	background: ${p => p.theme.ui.surface};
	border-bottom: 1px solid ${p => p.theme.ui.primaryFill};
	font-size: 12px;
	color: ${p => p.theme.ui.textOnAction};
`;

const Message = styled.span`
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const SaveAsButton = styled.button`
	cursor: pointer;
	padding: 4px 10px;
	font-size: 12px;
	background: ${p => p.theme.ui.primaryFill};
	color: ${p => p.theme.ui.textOnAction};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-radius: 4px;

	&:hover { filter: brightness(1.1); }
	&:focus-visible { outline: 2px solid ${p => p.theme.ui.primaryFill}; outline-offset: 2px; }
`;

export default UntitledBanner;
