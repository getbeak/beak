import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Folder, Hash, Link2, Network, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { createEndpointFolder, updateEndpoint } from '../lib/persist';
import { ENDPOINT_CONFIG, type EndpointKind } from '../types';

type Mode =
	| { kind: 'create' }
	| { kind: 'edit'; folderPath: string; folderName: string };

interface EndpointDialogProps {
	endpointKind: EndpointKind;
	mode: Mode;
	initialEndpoint?: string;
	onClose: (didChange: boolean) => void;
}

const ChakraInput = chakra('input');

/**
 * Polished endpoint authoring surface. Replaces the previous cramped form
 * with a spacious two-pane layout:
 *
 *   - LEFT: a hero column with the kind's identity (icon + label),
 *     a one-liner explaining what registering means, and the live preview
 *     of the resulting `tree/<folder>/` path.
 *   - RIGHT: the actual inputs — folder name (create-only), endpoint URL
 *     — wrapped in proper Beak input chrome (focus underline + brand
 *     accent caret), generously spaced, with clear labels and inline
 *     descriptions.
 *
 * Generic over endpoint kind so graphql and grpc share the chrome; only
 * the accent colour, copy, and placeholder change between modes.
 */
const EndpointDialog: React.FC<EndpointDialogProps> = ({ endpointKind, mode, initialEndpoint, onClose }) => {
	const config = ENDPOINT_CONFIG[endpointKind];
	const projectFolderPath = useAppSelector(s => s.global.project.folderPath);
	const isCreate = mode.kind === 'create';

	const [folderName, setFolderName] = useState(isCreate ? '' : mode.kind === 'edit' ? mode.folderName : '');
	const [endpoint, setEndpoint] = useState(initialEndpoint ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit =
		!busy && endpoint.trim().length > 0 && (isCreate ? folderName.trim().length > 0 : true);

	async function submit() {
		if (!projectFolderPath) {
			setError('No project loaded.');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			if (mode.kind === 'create') {
				await createEndpointFolder(projectFolderPath, {
					kind: endpointKind,
					folderName: folderName.trim(),
					endpoint: endpoint.trim(),
				});
			} else {
				await updateEndpoint(mode.folderPath, endpointKind, { endpoint: endpoint.trim() });
			}
			onClose(true);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setBusy(false);
		}
	}

	const folderPreview = (folderName.trim() || (isCreate ? 'untitled' : folderName)) + '/';
	const KindIcon = endpointKind === 'graphql' ? Hash : Network;

	return (
		<Dialog onClose={() => onClose(false)} tone={endpointKind === 'graphql' ? 'indigo' : 'teal'}>
			<Box w='640px' overflow='hidden'>
				<Flex>
					{/* Hero column */}
					<Flex
						direction='column'
						w='220px'
						flexShrink={0}
						p='5'
						gap='3'
						borderRightWidth='1px'
						borderColor='border.subtle'
						bg={`color-mix(in srgb, ${config.accentVar} 6%, transparent)`}
					>
						<Flex
							align='center'
							justify='center'
							w='44px'
							h='44px'
							borderRadius='lg'
							bg={`color-mix(in srgb, ${config.accentVar} 18%, transparent)`}
							borderWidth='1px'
							borderColor={`color-mix(in srgb, ${config.accentVar} 32%, transparent)`}
							color={config.accentToken}
							boxShadow={`0 6px 14px color-mix(in srgb, ${config.accentVar} 24%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)`}
						>
							<KindIcon size={18} strokeWidth={2} />
						</Flex>
						<Box>
							<Box fontSize='13px' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
								{isCreate ? `Add ${config.label}` : `Edit ${config.label}`}
							</Box>
							<Box mt='1' fontSize='11.5px' color='fg.muted' lineHeight='1.5'>
								{isCreate
									? config.tagline
									: 'Update the endpoint URL or the folder name. Requests authored under this folder will pick up the change immediately.'}
							</Box>
						</Box>
						<Box flex='1' />
						<Flex
							direction='column'
							gap='1'
							p='2.5'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.surface'
						>
							<Flex align='center' gap='1.5' color='fg.subtle' fontSize='10px' fontWeight='600' letterSpacing='0.05em' textTransform='uppercase'>
								<Folder size={10} strokeWidth={2} />
								{'Will write to'}
							</Flex>
							<Box fontSize='11.5px' fontFamily='mono' color='fg.default' truncate>
								{'tree/'}
								<Box as='span' color={config.accentToken} fontWeight='500'>
									{folderPreview}
								</Box>
							</Box>
							<Box fontSize='10px' color='fg.subtle'>
								{'_collection.json'}
							</Box>
						</Flex>
					</Flex>

					{/* Form column */}
					<Flex direction='column' flex='1' p='5' gap='4' minW={0}>
						{isCreate && (
							<Field label='Folder name' icon={Folder} description='Used as the folder under tree/ and as the display name.'>
								<DialogInput
									autoFocus
									value={folderName}
									placeholder='acme-api'
									onChange={setFolderName}
									accentVar={config.accentVar}
								/>
							</Field>
						)}
						<Field
							label='Endpoint URL'
							icon={Link2}
							description={
								endpointKind === 'graphql'
									? 'The GraphQL endpoint requests inside this folder send to.'
									: 'The gRPC service address. Plain `host:port` is fine.'
							}
						>
							<DialogInput
								autoFocus={!isCreate}
								value={endpoint}
								placeholder={config.endpointPlaceholder}
								onChange={setEndpoint}
								accentVar={config.accentVar}
							/>
						</Field>
						<Flex
							align='center'
							gap='2'
							color='fg.subtle'
							fontSize='10.5px'
							lineHeight='1.45'
							pt='1'
						>
							<ShieldCheck size={11} strokeWidth={1.8} />
							<Box flex='1'>
								{'Headers, auth, and introspection / proto wiring will land on this surface in a follow-up — your config will read in cleanly.'}
							</Box>
						</Flex>

						{error && (
							<Box
								p='2.5'
								borderWidth='1px'
								borderColor='accent.alert'
								borderRadius='sm'
								bg='color-mix(in srgb, var(--beak-colors-accent-alert) 8%, transparent)'
								color='accent.alert'
								fontSize='11.5px'
							>
								{error}
							</Box>
						)}

						<Flex justify='flex-end' gap='2' mt='1'>
							<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
								{'Cancel'}
							</Button>
							<Button size='sm' disabled={!canSubmit} onClick={submit}>
								{busy ? 'Saving…' : isCreate ? `Add ${config.label.toLowerCase()}` : 'Save changes'}
							</Button>
						</Flex>
					</Flex>
				</Flex>
			</Box>
		</Dialog>
	);
};

const Field: React.FC<
	React.PropsWithChildren<{
		label: string;
		description?: string;
		icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
	}>
> = ({ label, description, icon: Icon, children }) => (
	<Flex direction='column' gap='1.5'>
		<Flex align='center' gap='1.5'>
			<Box color='fg.subtle'>
				<Icon size={11} strokeWidth={1.8} />
			</Box>
			<Box
				as='label'
				fontSize='10.5px'
				fontWeight='600'
				color='fg.subtle'
				letterSpacing='0.05em'
				textTransform='uppercase'
			>
				{label}
			</Box>
		</Flex>
		{children}
		{description && (
			<Box fontSize='10.5px' color='fg.subtle' lineHeight='1.45'>
				{description}
			</Box>
		)}
	</Flex>
);

/**
 * Beak-themed input with a focus underline that matches the kind's accent.
 * Avoids the previous tiny-border-around-DebouncedInput look in favour of
 * a flush surface with a coloured caret + underline, mirroring the
 * BodyInputWrapper aesthetic in the request editor.
 */
const DialogInput: React.FC<{
	value: string;
	placeholder?: string;
	autoFocus?: boolean;
	accentVar: string;
	onChange: (v: string) => void;
}> = ({ value, placeholder, autoFocus, accentVar, onChange }) => (
	<ChakraInput
		type='text'
		value={value}
		autoFocus={autoFocus}
		placeholder={placeholder}
		onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
		w='100%'
		h='36px'
		px='3'
		fontSize='13px'
		fontFamily='inherit'
		color='fg.default'
		bg='bg.surface'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		outline='none'
		transition='border-color .12s ease, box-shadow .12s ease, background-color .12s ease'
		_placeholder={{ color: 'fg.subtle', fontStyle: 'italic' }}
		style={{ caretColor: accentVar }}
		_hover={{
			borderColor: 'border.emphasized',
		}}
		_focus={{
			borderColor: 'transparent',
			boxShadow: `inset 0 0 0 1px ${accentVar}, 0 0 0 3px color-mix(in srgb, ${accentVar} 22%, transparent)`,
			bg: 'bg.surface',
		}}
	/>
);

export default EndpointDialog;
