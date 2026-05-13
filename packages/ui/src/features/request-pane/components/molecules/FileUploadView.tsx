import { Box, Flex, IconButton } from '@chakra-ui/react';
import type { PreviewReferencedFileRes } from '@beak/common/ipc/fs';
import Button from '@beak/ui/components/atoms/Button';
import { pickAndAttachAsset } from '@beak/ui/features/asset-attachment/pick-and-attach';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { requestBodyAssetChanged, requestBodyFileChanged } from '@beak/ui/store/project/actions';
import { File, FileBox, Upload, X } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyFile } from '@getbeak/types/request';
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

	useEffect(() => {
		openPreview(body.payload.fileReferenceId);
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

	async function attachAsAsset(event: React.MouseEvent) {
		event.stopPropagation();
		const outcome = await pickAndAttachAsset();
		if (!outcome || !outcome.ok) return;
		dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: outcome.ref }));
	}

	function clearAssetRef(event: React.MouseEvent) {
		event.stopPropagation();
		dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: void 0 }));
	}

	const closeBtn = (onClick: (e: React.MouseEvent) => void) => (
		<IconButton
			aria-label='Remove'
			size='xs'
			variant='ghost'
			position='absolute'
			top='1'
			right='1'
			h='18px'
			w='18px'
			minW='18px'
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

	return (
		<Flex py='6' direction='column' align='center' gap='3'>
			<Flex
				position='relative'
				direction='column'
				align='center'
				justify='center'
				cursor='pointer'
				gap='2'
				w='280px'
				h='140px'
				borderRadius='xl'
				borderWidth={preview ? '1px' : '2px'}
				borderStyle={preview ? 'solid' : 'dashed'}
				borderColor={preview ? 'border.subtle' : 'color-mix(in srgb, var(--beak-colors-accent-pink) 25%, var(--beak-colors-border-subtle))'}
				bg={preview ? 'bg.surface' : 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, transparent)'}
				color='fg.muted'
				fontSize='xs'
				transition='border-color .14s ease, background-color .14s ease, box-shadow .14s ease, transform .08s ease'
				_hover={{
					borderColor: 'accent.pink',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
					boxShadow: '0 8px 20px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)',
				}}
				_active={{ transform: 'scale(0.99)' }}
				onClick={openFile}
			>
				{!preview && !assetRef && (
					<React.Fragment>
						<Flex
							align='center'
							justify='center'
							w='44px'
							h='44px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
							color='accent.pink'
						>
							<Upload size={20} strokeWidth={2} />
						</Flex>
						<Box color='fg.default' fontSize='sm' fontWeight='600'>{'Click to pick a file'}</Box>
						<Box fontSize='10px' color='fg.subtle' letterSpacing='0.04em' textTransform='uppercase' fontWeight='700'>
							{'Any binary up to ~10 MB'}
						</Box>
					</React.Fragment>
				)}
				{preview && (
					<React.Fragment>
						{closeBtn(clearFile)}
						<Flex
							align='center'
							justify='center'
							w='40px'
							h='40px'
							borderRadius='md'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
							color='accent.pink'
						>
							<File size={18} strokeWidth={2} />
						</Flex>
						<Box color='fg.default' fontWeight='600' fontSize='sm' textAlign='center' px='2' overflow='hidden' textOverflow='ellipsis' maxW='240px' whiteSpace='nowrap'>{preview.fileName}</Box>
						<Box fontSize='10px' color='fg.subtle' fontFamily='mono'>{prettyBytes(preview.fileSize)}</Box>
					</React.Fragment>
				)}
			</Flex>
			{assetRef && (
				<Flex
					position='relative'
					direction='column'
					align='center'
					justify='center'
					gap='1.5'
					w='280px'
					p='3'
					borderRadius='lg'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 30%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-teal) 8%, var(--beak-colors-bg-surface))'
					color='fg.muted'
					fontSize='xs'
					fontFamily='mono'
				>
					{closeBtn(clearAssetRef)}
					<Flex align='center' gap='1.5' color='accent.teal'>
						<FileBox size={14} strokeWidth={2} />
						<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' fontFamily='body'>
							{'Asset attached'}
						</Box>
					</Flex>
					<Box color='fg.default' fontSize='xs'>{`sha256:${assetRef.sha256.slice(0, 8)}…${assetRef.sha256.slice(-4)}`}</Box>
					<Box fontSize='10px' color='fg.subtle'>{prettyBytes(assetRef.size)}</Box>
				</Flex>
			)}
			<Button size='sm' colour='secondary' onClick={attachAsAsset}>
				{assetRef ? 'Replace asset…' : 'Attach as asset…'}
			</Button>
		</Flex>
	);
};

export default FileUploadView;
