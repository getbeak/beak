import Button from '@beak/ui/components/atoms/Button';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { Network } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { createGraphqlEndpointFolder, updateGraphqlEndpoint } from '../lib/persist';

type Mode =
	| { kind: 'create' }
	| { kind: 'edit'; folderPath: string; folderName: string };

interface GraphqlEndpointDialogProps {
	mode: Mode;
	initialEndpoint?: string;
	onClose: (didChange: boolean) => void;
}

/**
 * Minimal v1 dialog for authoring a GraphQL endpoint. Create mode collects
 * folder name + endpoint URL and writes a new `tree/<name>/_collection.json`
 * declaring the graphql source. Edit mode locks the folder name (rename is
 * out of scope here — it goes through the project tree's rename action) and
 * only edits the endpoint URL.
 *
 * Headers / auto-sync / introspection are deliberately absent — they
 * deserve their own design pass and dedicated surface. The schema reads
 * back into this dialog cleanly when we add them.
 */
const GraphqlEndpointDialog: React.FC<GraphqlEndpointDialogProps> = ({ mode, initialEndpoint, onClose }) => {
	const projectFolderPath = useAppSelector(s => s.global.project.folderPath);
	const isCreate = mode.kind === 'create';

	const [folderName, setFolderName] = useState('');
	const [endpoint, setEndpoint] = useState(initialEndpoint ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit =
		!busy &&
		endpoint.trim().length > 0 &&
		(isCreate ? folderName.trim().length > 0 : true);

	async function submit() {
		if (!projectFolderPath) {
			setError('No project loaded.');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			if (mode.kind === 'create') {
				await createGraphqlEndpointFolder(projectFolderPath, {
					folderName: folderName.trim(),
					endpoint: endpoint.trim(),
				});
			} else {
				await updateGraphqlEndpoint(mode.folderPath, { endpoint: endpoint.trim() });
			}
			onClose(true);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog onClose={() => onClose(false)} tone='indigo'>
			<Box w='460px' p='5'>
				<Flex align='center' gap='2.5' mb='4'>
					<Flex
						align='center'
						justify='center'
						w='32px'
						h='32px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
						color='accent.indigo'
					>
						<Network size={14} strokeWidth={2} />
					</Flex>
					<Box fontSize='md' fontWeight='600' color='fg.default'>
						{isCreate ? 'Add GraphQL endpoint' : `Edit ${mode.kind === 'edit' ? mode.folderName : ''}`}
					</Box>
				</Flex>

				<Flex direction='column' gap='3'>
					{isCreate && (
						<LabeledField
							label='Folder name'
							description="Used as the folder under tree/ and as the endpoint's display name."
						>
							<Box borderWidth='1px' borderColor='border.subtle' borderRadius='sm'>
								<DebouncedInput
									type='text'
									value={folderName}
									placeholder='Acme API'
									onChange={setFolderName}
								/>
							</Box>
						</LabeledField>
					)}
					<LabeledField label='Endpoint URL'>
						<Box borderWidth='1px' borderColor='border.subtle' borderRadius='sm'>
							<DebouncedInput
								type='text'
								value={endpoint}
								placeholder='https://api.example.com/graphql'
								onChange={setEndpoint}
							/>
						</Box>
					</LabeledField>
				</Flex>

				{error && (
					<Box
						mt='3'
						p='2'
						borderWidth='1px'
						borderColor='accent.alert'
						borderRadius='sm'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 8%, transparent)'
						color='accent.alert'
						fontSize='xs'
					>
						{error}
					</Box>
				)}

				<Flex justify='flex-end' gap='2' mt='4'>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Cancel'}
					</Button>
					<Button size='sm' disabled={!canSubmit} onClick={submit}>
						{busy ? 'Saving…' : isCreate ? 'Add endpoint' : 'Save changes'}
					</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

const LabeledField: React.FC<React.PropsWithChildren<{ label: string; description?: string }>> = ({
	label,
	description,
	children,
}) => (
	<Flex direction='column' gap='1'>
		<Box
			as='label'
			fontSize='10px'
			fontWeight='600'
			color='fg.subtle'
			letterSpacing='0.05em'
			textTransform='uppercase'
		>
			{label}
		</Box>
		{description && (
			<Box fontSize='11px' color='fg.subtle' lineHeight='1.4'>
				{description}
			</Box>
		)}
		<Box mt='0.5'>{children}</Box>
	</Flex>
);

export default GraphqlEndpointDialog;
