import type { GitFileStatus } from '@beak/state/git';
import { Box, Flex } from '@chakra-ui/react';
import { File, FileMinus, FilePlus, FilePen } from 'lucide-react';
import * as React from 'react';

interface FileChangesListProps {
	files: GitFileStatus[];
	loading: boolean;
}

const MAX_VISIBLE = 50;

const FileChangesList: React.FC<FileChangesListProps> = ({ files, loading }) => {
	if (loading && files.length === 0) {
		return (
			<Box fontSize='xs' color='fg.subtle' fontFamily='mono' px='2' py='3'>
				{'Checking working tree…'}
			</Box>
		);
	}

	if (files.length === 0) {
		return (
			<Box
				p='4'
				textAlign='center'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor='border.subtle'
				borderRadius='md'
				bg='bg.surface'
				color='fg.subtle'
				fontSize='sm'
			>
				{'Nothing to commit — working tree is clean.'}
			</Box>
		);
	}

	const visible = files.slice(0, MAX_VISIBLE);
	const overflow = files.length - visible.length;

	return (
		<Box
			maxH='240px'
			overflowY='auto'
			borderWidth='1px'
			borderColor='border.subtle'
			borderRadius='md'
			bg='bg.surface'
		>
			<Flex direction='column'>
				{visible.map(file => (
					<FileRow key={file.filepath} file={file} />
				))}
			</Flex>
			{overflow > 0 && (
				<Box px='3' py='2' fontSize='10px' color='fg.subtle' borderTopWidth='1px' borderColor='border.subtle' fontFamily='mono'>
					{`+ ${overflow} more file${overflow === 1 ? '' : 's'} (only the first ${MAX_VISIBLE} are shown)`}
				</Box>
			)}
		</Box>
	);
};

interface FileRowProps {
	file: GitFileStatus;
}

const FileRow: React.FC<FileRowProps> = ({ file }) => {
	const tone = file.untracked
		? 'var(--beak-colors-accent-teal)'
		: file.deleted
			? 'var(--beak-colors-accent-alert)'
			: 'var(--beak-colors-accent-pink)';
	const Icon = file.untracked ? FilePlus : file.deleted ? FileMinus : file.unstaged ? FilePen : File;
	const label = file.untracked ? 'NEW' : file.deleted ? 'DEL' : file.staged && !file.unstaged ? 'STG' : 'MOD';

	return (
		<Flex
			align='center'
			gap='2'
			px='2.5'
			py='1.5'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			_last={{ borderBottomWidth: '0' }}
		>
			<Flex
				flex='0 0 auto'
				align='center'
				justify='center'
				w='20px'
				h='20px'
				borderRadius='sm'
				css={{
					background: `color-mix(in srgb, ${tone} 14%, transparent)`,
					borderWidth: '1px',
					borderStyle: 'solid',
					borderColor: `color-mix(in srgb, ${tone} 26%, transparent)`,
					color: tone,
				}}
			>
				<Icon size={11} strokeWidth={2.2} />
			</Flex>
			<Box
				flex='1 1 auto'
				minW={0}
				fontSize='xs'
				fontFamily='mono'
				color='fg.default'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
			>
				{file.filepath}
			</Box>
			<Box
				flex='0 0 auto'
				fontSize='9px'
				fontWeight='700'
				letterSpacing='0.06em'
				css={{ color: tone }}
			>
				{label}
			</Box>
		</Flex>
	);
};

export default FileChangesList;
