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
		<Flex py='5' direction='column' align='center' gap='3'>
			<Flex
				position='relative'
				direction='column'
				align='center'
				justify='center'
				cursor='pointer'
				gap='1'
				w='220px'
				h='110px'
				borderRadius='lg'
				borderWidth='1px'
				borderStyle={preview ? 'solid' : 'dashed'}
				borderColor={preview ? 'border.default' : 'border.subtle'}
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
				color='fg.muted'
				fontSize='xs'
				transition='border-color .12s ease, background-color .12s ease'
				_hover={{
					borderColor: 'accent.pink',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
				}}
				onClick={openFile}
			>
				{!preview && !assetRef && (
					<React.Fragment>
						<Box opacity={0.45} color='fg.subtle'>
							<Upload size={20} />
						</Box>
						<Box>{'Click to pick a file'}</Box>
					</React.Fragment>
				)}
				{preview && (
					<React.Fragment>
						{closeBtn(clearFile)}
						<Box color='accent.pink'>
							<File size={18} />
						</Box>
						<Box color='fg.default' fontWeight='500'>{preview.fileName}</Box>
						<Box fontSize='10px' color='fg.subtle'>{prettyBytes(preview.fileSize)}</Box>
					</React.Fragment>
				)}
			</Flex>
			{assetRef && (
				<Flex
					position='relative'
					direction='column'
					align='center'
					justify='center'
					gap='1'
					w='220px'
					p='2.5'
					borderRadius='lg'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
					color='fg.muted'
					fontSize='xs'
					fontFamily='mono'
				>
					{closeBtn(clearAssetRef)}
					<Box color='accent.teal'>
						<FileBox size={16} />
					</Box>
					<Box color='fg.default'>{`sha256:${assetRef.sha256.slice(0, 8)}…${assetRef.sha256.slice(-4)}`}</Box>
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
