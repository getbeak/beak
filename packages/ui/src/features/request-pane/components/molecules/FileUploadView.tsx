import type { PreviewReferencedFileRes } from '@beak/common/ipc/fs';
import { attachFile } from '@beak/ui/features/asset-attachment/attach-file';
import { pickAndAttachAsset } from '@beak/ui/features/asset-attachment/pick-and-attach';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { requestBodyAssetChanged, requestBodyFileChanged } from '@beak/ui/store/project/actions';
import { Box, Flex, IconButton } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyFile } from '@getbeak/types/request';
import { File, FileBox, Upload, X } from 'lucide-react';
import mime from 'mime-types';
import prettyBytes from 'pretty-bytes';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

export interface FileUploadViewProps {
	node: ValidRequestNode;
}

const FileUploadView: React.FC<FileUploadViewProps> = ({ node }) => {
	const dispatch = useDispatch();
	const body = node.info.body as RequestBodyFile;
	const [preview, setPreview] = useState<PreviewReferencedFileRes>();
	const [dragOver, setDragOver] = useState(false);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let cancelled = false;
		openPreviewFor(body.payload.fileReferenceId).catch(() => {
			/* ignore */
		});
		return () => {
			cancelled = true;
		};

		async function openPreviewFor(fileReferenceId: string | undefined) {
			if (!fileReferenceId) return;
			const result = await ipcFsService.previewReferencedFile(fileReferenceId);
			if (cancelled) return;
			if (!result) {
				setPreview(void 0);
				dispatch(
					requestBodyFileChanged({
						requestId: node.id,
						fileReferenceId: void 0,
						contentType: void 0,
					}),
				);
				return;
			}
			setPreview(result);
			dispatch(
				requestBodyFileChanged({
					requestId: node.id,
					fileReferenceId,
					contentType: mime.lookup(result.fileExtension) || '',
				}),
			);
		}
	}, [body.payload.fileReferenceId]);

	async function clearFile(event: React.MouseEvent) {
		event.stopPropagation();
		setPreview(void 0);
		dispatch(
			requestBodyFileChanged({
				requestId: node.id,
				fileReferenceId: void 0,
				contentType: void 0,
			}),
		);
	}

	async function openPreview(fileReferenceId: string | undefined) {
		if (!fileReferenceId) return;

		const preview = await ipcFsService.previewReferencedFile(fileReferenceId);

		if (!preview) {
			setPreview(void 0);
			dispatch(
				requestBodyFileChanged({
					requestId: node.id,
					fileReferenceId: void 0,
					contentType: void 0,
				}),
			);
			return;
		}

		setPreview(preview);
		dispatch(
			requestBodyFileChanged({
				requestId: node.id,
				fileReferenceId,
				contentType: mime.lookup(preview.fileExtension) || '',
			}),
		);
	}

	async function openFile() {
		const response = await ipcFsService.openReferenceFile();
		if (!response) return;
		await openPreview(response.fileReferenceId);
	}

	const assetRef = body.payload.assetRef;

	async function attachAsAsset(event: React.MouseEvent | React.KeyboardEvent) {
		event.stopPropagation();
		const outcome = await pickAndAttachAsset();
		if (!outcome || !outcome.ok) return;
		dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: outcome.ref }));
	}

	function clearAssetRef(event: React.MouseEvent) {
		event.stopPropagation();
		dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: void 0 }));
	}

	async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
		event.preventDefault();
		event.stopPropagation();
		setDragOver(false);

		const droppedFile = event.dataTransfer.files?.[0];
		if (!droppedFile) return;

		setBusy(true);
		try {
			const bytes = new Uint8Array(await droppedFile.arrayBuffer());
			const outcome = await attachFile({
				file: { name: droppedFile.name, type: droppedFile.type, bytes },
			});
			if (outcome.ok) {
				dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: outcome.ref }));
			} else {
				console.warn('drop attach failed', outcome.error);
			}
		} catch (err) {
			console.warn('drop attach failed', err);
		} finally {
			setBusy(false);
		}
	}

	const closeBtn = (onClick: (e: React.MouseEvent) => void) => (
		<IconButton
			aria-label='Remove'
			size='xs'
			variant='ghost'
			position='absolute'
			top='1.5'
			right='1.5'
			h='20px'
			w='20px'
			minW='20px'
			borderRadius='sm'
			color='fg.subtle'
			_hover={{
				color: 'accent.alert',
				bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)',
			}}
			onClick={onClick}
		>
			<X size={11} />
		</IconButton>
	);

	const hasAnything = Boolean(preview || assetRef);

	return (
		<Flex direction='column' gap='2' p='3'>
			{/* Primary dropzone — defaults to the content-addressed asset flow.
			    Click attaches as asset; drag/drop attaches as asset; the legacy
			    external-file row below pivots to the path-based flow for users
			    that need to point at bytes outside the project. */}
			<Flex
				role='button'
				tabIndex={0}
				aria-label={hasAnything ? 'Replace file' : 'Drop a file here or click to choose'}
				aria-busy={busy}
				position='relative'
				direction='row'
				align='center'
				gap='2.5'
				cursor='pointer'
				w='100%'
				minH='64px'
				px='3'
				py='2.5'
				borderRadius='lg'
				borderWidth='1px'
				borderStyle={hasAnything ? 'solid' : 'dashed'}
				borderColor={
					dragOver
						? 'accent.pink'
						: hasAnything
							? 'border.subtle'
							: 'color-mix(in srgb, var(--beak-colors-accent-pink) 28%, var(--beak-colors-border-subtle))'
				}
				bg={
					dragOver
						? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						: hasAnything
							? 'bg.surface'
							: 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, transparent)'
				}
				color='fg.muted'
				fontSize='xs'
				transition='border-color .14s ease, background-color .14s ease, box-shadow .14s ease, transform .08s ease'
				_hover={{
					borderColor: 'accent.pink',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
					boxShadow: '0 4px 16px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)',
				}}
				_active={{ transform: 'scale(0.998)' }}
				onClick={(event: React.MouseEvent) => attachAsAsset(event)}
				onKeyDown={(event: React.KeyboardEvent) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						attachAsAsset(event);
					}
				}}
				onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
					event.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
			>
				<Flex
					align='center'
					justify='center'
					flex='0 0 auto'
					w='36px'
					h='36px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
					color='accent.pink'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					{assetRef ? <FileBox size={16} strokeWidth={2} /> : <Upload size={16} strokeWidth={2} />}
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Box color='fg.default' fontSize='sm' fontWeight='600' letterSpacing='-0.005em' lineHeight='1.2'>
						{busy
							? 'Attaching…'
							: assetRef
								? 'Asset attached'
								: dragOver
									? 'Drop to attach'
									: 'Drop a file here, or click to choose'}
					</Box>
					<Box fontSize='11px' color='fg.subtle' mt='0.5' fontVariantNumeric='tabular-nums'>
						{assetRef
							? `sha256:${assetRef.sha256.slice(0, 10)}…${assetRef.sha256.slice(-4)} · ${prettyBytes(assetRef.size)}`
							: 'Content-addressed asset · idempotent · stored in this project'}
					</Box>
				</Box>
				{assetRef && closeBtn(clearAssetRef)}
			</Flex>

			{/* Legacy file-reference (path-based) flow */}
			<Flex
				role='button'
				tabIndex={0}
				aria-label={preview ? 'Replace external file reference' : 'Reference an external file'}
				position='relative'
				direction='row'
				align='center'
				gap='2.5'
				cursor='pointer'
				w='100%'
				minH='52px'
				px='3'
				py='2'
				borderRadius='lg'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 40%, transparent)'
				color='fg.muted'
				fontSize='xs'
				transition='border-color .14s ease, background-color .14s ease'
				_hover={{
					borderColor: 'color-mix(in srgb, var(--beak-colors-accent-teal) 40%, var(--beak-colors-border-default))',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 6%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					borderColor: 'accent.teal',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-teal) 32%, transparent)',
				}}
				onClick={openFile}
				onKeyDown={(event: React.KeyboardEvent) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openFile();
					}
				}}
			>
				<Flex
					align='center'
					justify='center'
					flex='0 0 auto'
					w='28px'
					h='28px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-teal) 12%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 26%, transparent)'
					color='accent.teal'
				>
					<File size={14} strokeWidth={2} />
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Box
						color='fg.default'
						fontSize='12px'
						fontWeight='600'
						letterSpacing='-0.005em'
						lineHeight='1.2'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{preview ? preview.fileName : 'External file reference'}
					</Box>
					<Box fontSize='10px' color='fg.subtle' mt='0.5' fontVariantNumeric='tabular-nums'>
						{preview ? prettyBytes(preview.fileSize) : 'Stream from a path on disk · live re-read on each send'}
					</Box>
				</Box>
				{preview && closeBtn(clearFile)}
			</Flex>
		</Flex>
	);
};

export default FileUploadView;
