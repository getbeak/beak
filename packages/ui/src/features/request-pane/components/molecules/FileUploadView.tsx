import { Box, Button, Flex } from '@chakra-ui/react';
import type { PreviewReferencedFileRes } from '@beak/common/ipc/fs';
import { pickAndAttachAsset } from '@beak/ui/features/asset-attachment/pick-and-attach';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { requestBodyAssetChanged, requestBodyFileChanged } from '@beak/ui/store/project/actions';
import { X } from 'lucide-react';
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
		<Box position='absolute' right='1.5' top='1' bg='transparent' p='1' onClick={onClick}>
			<X />
		</Box>
	);

	return (
		<Flex py='5' direction='column' align='center' gap='2.5'>
			<Flex
				position='relative'
				direction='column'
				align='center'
				justify='center'
				cursor='pointer'
				gap='1'
				w='200px'
				h='110px'
				borderRadius='lg'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface.emphasized'
				color='fg.muted'
				fontSize='sm'
				onClick={openFile}
			>
				{!preview && !assetRef && 'No file selected...'}
				{preview && (
					<React.Fragment>
						{closeBtn(clearFile)}
						<Box>{preview.fileName}</Box>
						<Box>{prettyBytes(preview.fileSize)}</Box>
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
					w='200px'
					p='2.5'
					borderRadius='lg'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					bg='bg.surface.emphasized'
					color='fg.muted'
					fontSize='xs'
					fontFamily='mono'
				>
					{closeBtn(clearAssetRef)}
					<Box>{`sha256:${assetRef.sha256.slice(0, 8)}…${assetRef.sha256.slice(-4)}`}</Box>
					<Box>{prettyBytes(assetRef.size)}</Box>
				</Flex>
			)}
			<Button
				bg='transparent'
				borderWidth='1px'
				borderColor='border.subtle'
				color='fg.default'
				px='3'
				py='1.5'
				borderRadius='md'
				fontSize='sm'
				cursor='pointer'
				h='auto'
				_hover={{ bg: 'bg.surface.emphasized' }}
				onClick={attachAsAsset}
			>
				{assetRef ? 'Replace asset…' : 'Attach as asset…'}
			</Button>
		</Flex>
	);
};

export default FileUploadView;
