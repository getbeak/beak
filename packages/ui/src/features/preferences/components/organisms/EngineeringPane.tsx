import Button from '@beak/ui/components/atoms/Button';
import { ipcDialogService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import React from 'react';

import AgentPreferencesSection from '../molecules/AgentPreferencesSection';
import Row from '../atoms/Row';
import Section from '../atoms/Section';

const EngineeringPane: React.FC = () => (
	<>
		<AgentPreferencesSection />
		<Section title='Maintenance'>
			<Row
				label='Reset config & cache'
				description='Clears local preferences and cached responses. Project files are not affected.'
			>
				<Button
					colour='secondary'
					size='sm'
					onClick={async () => {
						const result = await ipcDialogService.showMessageBox({
							title: 'Reset config & cache?',
							message: 'This clears all local preferences and cached responses.',
							detail: 'Project files are not affected.',
							type: 'warning',
							buttons: ['Reset', 'Cancel'],
							defaultId: 1,
							cancelId: 1,
						});
						if (result.response === 1) return;
						ipcPreferencesService.resetConfig();
					}}
				>
					{'Reset'}
				</Button>
			</Row>
		</Section>
	</>
);

export default EngineeringPane;
