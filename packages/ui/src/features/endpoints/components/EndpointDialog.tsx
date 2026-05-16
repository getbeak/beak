import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { GrpcDescriptor } from '@beak/state/schemas';
import { AlertOctagon, FileCode, Folder, Hash, Network, Radio } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { createEndpointFolder, updateEndpoint } from '../lib/persist';
import { ENDPOINT_CONFIG, type EndpointKind } from '../types';

type Mode = { kind: 'create' } | { kind: 'edit'; folderPath: string; folderName: string };

interface EndpointDialogProps {
	endpointKind: EndpointKind;
	mode: Mode;
	initialEndpoint?: string;
	/** Existing descriptor on the source — only meaningful when kind is grpc. */
	initialDescriptor?: GrpcDescriptor;
	onClose: (didChange: boolean) => void;
}

type DescriptorKind = 'reflection' | 'proto' | 'buf';

const ChakraInput = chakra('input');

/**
 * Endpoint authoring surface — single-column form using the shared Dialog
 * primitives. The destination-folder preview lives inline as a quiet
 * monospace chip beneath the form, replacing the previous two-pane layout
 * whose sidebar made the dialog feel busy without paying its weight.
 */
const EndpointDialog: React.FC<EndpointDialogProps> = ({
	endpointKind,
	mode,
	initialEndpoint,
	initialDescriptor,
	onClose,
}) => {
	const config = ENDPOINT_CONFIG[endpointKind];
	const projectFolderPath = useAppSelector(s => s.global.project.folderPath);
	const isCreate = mode.kind === 'create';
	const isGrpc = endpointKind === 'grpc';

	const [folderName, setFolderName] = useState(isCreate ? '' : mode.kind === 'edit' ? mode.folderName : '');
	const [endpoint, setEndpoint] = useState(initialEndpoint ?? '');
	const [descriptorKind, setDescriptorKind] = useState<DescriptorKind>(initialDescriptor?.type ?? 'reflection');
	const [protoPath, setProtoPath] = useState(initialDescriptor?.type === 'proto' ? initialDescriptor.path : '');
	const [bufModule, setBufModule] = useState(initialDescriptor?.type === 'buf' ? initialDescriptor.module : '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function buildDescriptor(): GrpcDescriptor | undefined {
		if (!isGrpc) return undefined;
		switch (descriptorKind) {
			case 'reflection':
				return { type: 'reflection' };
			case 'proto':
				return protoPath.trim().length > 0 ? { type: 'proto', path: protoPath.trim() } : undefined;
			case 'buf':
				return bufModule.trim().length > 0 ? { type: 'buf', module: bufModule.trim() } : undefined;
		}
	}

	const descriptorReady =
		!isGrpc ||
		descriptorKind === 'reflection' ||
		(descriptorKind === 'proto' && protoPath.trim().length > 0) ||
		(descriptorKind === 'buf' && bufModule.trim().length > 0);

	const canSubmit =
		!busy &&
		endpoint.trim().length > 0 &&
		descriptorReady &&
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
				await createEndpointFolder(projectFolderPath, {
					kind: endpointKind,
					folderName: folderName.trim(),
					endpoint: endpoint.trim(),
					descriptor: buildDescriptor(),
				});
			} else {
				await updateEndpoint(mode.folderPath, endpointKind, {
					endpoint: endpoint.trim(),
					descriptor: buildDescriptor(),
				});
			}
			onClose(true);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setBusy(false);
		}
	}

	const folderPreview = `${folderName.trim() || (isCreate ? 'untitled' : folderName)}/`;
	const KindIcon = endpointKind === 'graphql' ? Hash : Network;
	const tone = endpointKind === 'graphql' ? 'indigo' : 'teal';

	return (
		<Dialog onClose={() => onClose(false)} tone={tone}>
			<Box w='480px'>
				<DialogHeader
					icon={<KindIcon size={14} strokeWidth={2.2} />}
					title={isCreate ? `Add ${config.label}` : `Edit ${config.label}`}
					description={
						isCreate
							? config.tagline
							: 'Update the endpoint URL or the folder name. Requests in this folder pick up the change immediately.'
					}
				/>
				<DialogBody>
					<Flex direction='column' gap='3'>
						{isCreate && (
							<Field label='Folder name' description='Folder under tree/ and the endpoint’s display name.'>
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

						{isGrpc && (
							<Field
								label='Schema source'
								description={
									descriptorKind === 'reflection'
										? 'Use the gRPC server reflection service to fetch method + message descriptors on demand.'
										: descriptorKind === 'proto'
											? 'Parse a local `.proto` file to derive the descriptors.'
											: 'Pull the descriptors from a Buf Schema Registry module.'
								}
							>
								<Flex direction='column' gap='2'>
									<DescriptorPicker
										value={descriptorKind}
										onChange={setDescriptorKind}
										accentVar={config.accentVar}
									/>
									{descriptorKind === 'proto' && (
										<DialogInput
											value={protoPath}
											placeholder='./protos/service.proto'
											onChange={setProtoPath}
											accentVar={config.accentVar}
										/>
									)}
									{descriptorKind === 'buf' && (
										<DialogInput
											value={bufModule}
											placeholder='buf.build/connectrpc/eliza'
											onChange={setBufModule}
											accentVar={config.accentVar}
										/>
									)}
								</Flex>
							</Field>
						)}

						<Flex
							align='center'
							gap='2'
							px='2.5'
							py='1.5'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							fontSize='xs'
						>
							<Box color='fg.subtle' flex='0 0 auto'>
								<Folder size={11} strokeWidth={2} />
							</Box>
							<Box color='fg.subtle' fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em'>
								{'Saves to'}
							</Box>
							<Box flex='1 1 auto' minW={0} fontFamily='mono' color='fg.default' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
								{'tree/'}
								<Box as='span' color={config.accentToken} fontWeight='500'>
									{folderPreview}
								</Box>
								<Box as='span' color='fg.subtle'>
									{'_collection.json'}
								</Box>
							</Box>
						</Flex>

						{error && (
							<Flex
								align='center'
								gap='2'
								px='2.5'
								py='1.5'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 38%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
								fontSize='xs'
							>
								<Box color='accent.alert' flex='0 0 auto'>
									<AlertOctagon size={13} />
								</Box>
								<Box color='fg.default'>{error}</Box>
							</Flex>
						)}
					</Flex>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Cancel'}
					</Button>
					<Button size='sm' disabled={!canSubmit} onClick={submit}>
						{busy ? 'Saving…' : isCreate ? `Add ${config.label.toLowerCase()}` : 'Save changes'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

interface FieldProps {
	label: string;
	description?: string;
}

const Field: React.FC<React.PropsWithChildren<FieldProps>> = ({ label, description, children }) => (
	<Flex direction='column' gap='1'>
		<Box
			as='label'
			fontSize='10px'
			fontWeight='700'
			color='fg.subtle'
			letterSpacing='0.06em'
			textTransform='uppercase'
		>
			{label}
		</Box>
		{children}
		{description && (
			<Box fontSize='11px' color='fg.subtle' lineHeight='1.45'>
				{description}
			</Box>
		)}
	</Flex>
);

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
		h='32px'
		px='2.5'
		fontSize='13px'
		fontFamily='inherit'
		color='fg.default'
		bg='bg.canvas'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		outline='none'
		transition='border-color .12s ease, box-shadow .12s ease'
		_placeholder={{ color: 'fg.subtle' }}
		style={{ caretColor: accentVar }}
		_hover={{ borderColor: 'border.emphasized' }}
		_focus={{
			borderColor: 'transparent',
			boxShadow: `inset 0 0 0 1px ${accentVar}, 0 0 0 3px color-mix(in srgb, ${accentVar} 18%, transparent)`,
		}}
	/>
);

/**
 * Three-way segmented control for the gRPC schema-source picker. The icons
 * give a quick read on each option's flavour: Radio for over-the-wire
 * reflection, FileCode for a local proto, Network for the BSR (the Network
 * icon already belongs to the gRPC kind so the BSR reuse reads as
 * "another network-fetched descriptor source").
 */
const DescriptorPicker: React.FC<{
	value: DescriptorKind;
	onChange: (next: DescriptorKind) => void;
	accentVar: string;
}> = ({ value, onChange, accentVar }) => {
	const options: { kind: DescriptorKind; label: string; Icon: typeof Radio }[] = [
		{ kind: 'reflection', label: 'Reflection', Icon: Radio },
		{ kind: 'proto', label: 'Proto file', Icon: FileCode },
		{ kind: 'buf', label: 'Buf module', Icon: Network },
	];
	const ChakraButton = chakra('button');
	return (
		<Flex align='stretch' borderWidth='1px' borderColor='border.subtle' borderRadius='md' p='0.5' gap='0.5'>
			{options.map(opt => {
				const active = opt.kind === value;
				return (
					<ChakraButton
						key={opt.kind}
						type='button'
						aria-pressed={active}
						onClick={() => onChange(opt.kind)}
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						gap='1'
						flex='1 1 0'
						h='26px'
						px='2'
						borderRadius='sm'
						border='none'
						bg={
							active
								? `color-mix(in srgb, ${accentVar} 14%, transparent)`
								: 'transparent'
						}
						color={active ? 'fg.default' : 'fg.muted'}
						fontSize='11.5px'
						fontWeight={active ? '600' : '500'}
						cursor='pointer'
						transition='color .12s ease, background-color .12s ease'
						_hover={
							active
								? undefined
								: { bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)', color: 'fg.default' }
						}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
						}}
					>
						<opt.Icon size={11} strokeWidth={2} />
						<Box as='span'>{opt.label}</Box>
					</ChakraButton>
				);
			})}
		</Flex>
	);
};

export default EndpointDialog;
