import { Box, Flex, chakra } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Input from '@beak/ui/components/atoms/Input';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { useAppSelector } from '@beak/ui/store/redux';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagon, CheckCircle2, FolderPlus, FolderTree } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { importOpenApi } from '../import-action';
import { pickSpecFile } from '../pick-file';
import { actions } from '../store';

const DEFAULT_FOLDER = 'tree/openapi';
const ChakraButton = chakra('button');

const OpenApiImportDialog: React.FC = () => {
	const dispatch = useDispatch();
	const state = useAppSelector(s => s.features.openApiImport);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const [folderInput, setFolderInput] = useState(state.targetFolder || DEFAULT_FOLDER);

	const folders = useMemo(() => {
		if (!projectTree) return [];
		return Object.values(projectTree)
			.filter(n => n.type === 'folder')
			.map(n => n.filePath)
			.sort((a, b) => a.localeCompare(b));
	}, [projectTree]);

	// Phase 1: kick off the native file picker as soon as we enter picking-file.
	useEffect(() => {
		if (state.phase !== 'picking-file') return;
		let cancelled = false;
		pickSpecFile()
			.then(file => {
				if (cancelled) return;
				if (!file) {
					dispatch(actions.filePickCancelled());
					return;
				}
				dispatch(actions.filePicked(file));
			})
			.catch(() => {
				if (cancelled) return;
				dispatch(actions.filePickCancelled());
			});
		return () => {
			cancelled = true;
		};
	}, [state.phase, dispatch]);

	// Phase 3: when the user confirms a folder, run the import.
	useEffect(() => {
		if (state.phase !== 'importing' || !state.file) return;
		let cancelled = false;
		importOpenApi({
			source: state.file.source,
			filename: state.file.filename,
			targetFolder: state.targetFolder,
		})
			.then(outcome => {
				if (cancelled) return;
				if (outcome.ok) {
					dispatch(actions.importResolved({ outcome: outcome.result, notice: outcome.notice }));
				} else {
					dispatch(actions.importRejected({ error: outcome.error }));
				}
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : String(err);
				dispatch(actions.importRejected({ error: `Import failed — ${message}` }));
			});
		return () => {
			cancelled = true;
		};
	}, [state.phase, state.file, state.targetFolder, dispatch]);

	// Re-seed the folder input whenever the dialog opens fresh.
	useEffect(() => {
		if (state.phase === 'picking-folder') {
			setFolderInput(state.targetFolder || DEFAULT_FOLDER);
		}
	}, [state.phase, state.targetFolder]);

	if (state.phase === 'idle' || state.phase === 'picking-file') return null;

	function onSubmitFolder() {
		const trimmed = folderInput.trim();
		if (!trimmed) return;
		const normalized = trimmed.startsWith('tree/') ? trimmed : `tree/${trimmed.replace(/^\/+/, '')}`;
		dispatch(actions.folderChosen({ targetFolder: normalized }));
	}

	function onClose() {
		dispatch(actions.close());
	}

	return (
		<Dialog onClose={onClose}>
			<Box p='4' minW='420px' maxW='520px'>
				<AnimatePresence mode='wait'>
					{state.phase === 'picking-folder' && (
						<motion.div
							key='folder'
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.14 }}
						>
							<Flex align='center' gap='2' color='accent.pink' mb='2'>
								<FolderTree size={16} />
								<Box fontWeight='600' fontSize='md' color='fg.default'>
									{'Where should this OpenAPI spec land?'}
								</Box>
							</Flex>
							<Box fontSize='xs' color='fg.muted' mb='3'>
								{state.file?.filename ? (
									<>
										{'Importing '}
										<Box as='span' fontFamily='mono' color='fg.default'>
											{state.file.filename}
										</Box>
									</>
								) : (
									'Importing OpenAPI spec'
								)}
							</Box>

							<Box mb='2'>
								<Box fontSize='10px' fontWeight='600' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle' mb='1'>
									{'Target folder'}
								</Box>
								<Input
									$beakSize='md'
									value={folderInput}
									placeholder={DEFAULT_FOLDER}
									onChange={e => setFolderInput(e.currentTarget.value)}
									onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											onSubmitFolder();
										}
									}}
								/>
								<Box mt='1' fontSize='10px' color='fg.subtle'>
									{'Will resolve under '}
									<Box as='span' fontFamily='mono'>
										{folderInput.startsWith('tree/') ? folderInput : `tree/${folderInput.replace(/^\/+/, '')}`}
									</Box>
								</Box>
							</Box>

							{folders.length > 0 && (
								<Box mt='3'>
									<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle' mb='1.5'>
										{'Existing folders'}
									</Box>
									<Box
										maxH='180px'
										overflowY='auto'
										borderRadius='md'
										borderWidth='1px'
										borderColor='border.subtle'
										bg='bg.canvas'
										css={{
											'&::-webkit-scrollbar': { width: '6px' },
											'&::-webkit-scrollbar-thumb': {
												background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 25%, transparent)',
												borderRadius: '3px',
											},
										}}
									>
										{folders.map(path => {
											const isPicked = folderInput === path;
											return (
												<ChakraButton
													key={path}
													type='button'
													display='flex'
													alignItems='center'
													gap='1.5'
													w='100%'
													textAlign='left'
													bg='transparent'
													border='none'
													px='2'
													py='1'
													fontSize='xs'
													fontFamily='mono'
													color={isPicked ? 'accent.pink' : 'fg.muted'}
													cursor='pointer'
													_hover={{
														bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
														color: 'accent.pink',
													}}
													onClick={() => setFolderInput(path)}
												>
													<FolderTree size={10} />
													<Box overflow='hidden' textOverflow='ellipsis'>
														{path}
													</Box>
												</ChakraButton>
											);
										})}
										<ChakraButton
											type='button'
											display='flex'
											alignItems='center'
											gap='1.5'
											w='100%'
											textAlign='left'
											bg='transparent'
											border='none'
											px='2'
											py='1'
											fontSize='xs'
											fontFamily='mono'
											color='fg.subtle'
											cursor='pointer'
											_hover={{
												bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 12%, transparent)',
												color: 'accent.teal',
											}}
											onClick={() => setFolderInput(DEFAULT_FOLDER)}
										>
											<FolderPlus size={10} />
											<Box>{`Use default (${DEFAULT_FOLDER})`}</Box>
										</ChakraButton>
									</Box>
								</Box>
							)}

							<Flex justify='flex-end' gap='2' mt='4'>
								<Button colour='secondary' size='sm' onClick={onClose}>{'Cancel'}</Button>
								<Button size='sm' onClick={onSubmitFolder}>{'Import'}</Button>
							</Flex>
						</motion.div>
					)}

					{state.phase === 'importing' && (
						<motion.div
							key='importing'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<Flex direction='column' align='center' py='6' gap='3'>
								<Flex
									align='center'
									justify='center'
									w='48px'
									h='48px'
									borderRadius='full'
									bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
									color='accent.pink'
									boxShadow='0 0 20px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
								>
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 1.1, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
										style={{ display: 'inline-flex' }}
									>
										<FolderTree size={20} strokeWidth={2} />
									</motion.div>
								</Flex>
								<Flex direction='column' align='center' gap='1'>
									<Box fontSize='sm' fontWeight='600' color='fg.default'>
										{'Importing OpenAPI spec'}
									</Box>
									<Box fontSize='xs' color='fg.muted'>
										{'→ '}
										<Box as='span' fontFamily='mono' color='fg.default'>{state.targetFolder}</Box>
									</Box>
								</Flex>
							</Flex>
						</motion.div>
					)}

					{state.phase === 'result' && state.result && (
						<motion.div
							key='result'
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.14 }}
						>
							{state.result.ok ? (
								<Flex direction='column' gap='2.5'>
									<Flex align='center' gap='2'>
										<Flex
											align='center'
											justify='center'
											w='28px'
											h='28px'
											borderRadius='full'
											bg='color-mix(in srgb, var(--beak-colors-accent-teal) 16%, transparent)'
											color='accent.teal'
										>
											<CheckCircle2 size={15} strokeWidth={2.2} />
										</Flex>
										<Box fontWeight='600' fontSize='md' color='fg.default'>
											{'OpenAPI imported'}
										</Box>
									</Flex>
									<Box fontSize='sm' color='fg.muted' lineHeight='1.5'>
										{state.result.notice ??
											`Imported into ${state.targetFolder}. The collection is ready to edit in the project tree.`}
									</Box>
								</Flex>
							) : (
								<Flex direction='column' gap='2.5'>
									<Flex align='center' gap='2'>
										<Flex
											align='center'
											justify='center'
											w='28px'
											h='28px'
											borderRadius='full'
											bg='color-mix(in srgb, var(--beak-colors-accent-alert) 16%, transparent)'
											color='accent.alert'
										>
											<AlertOctagon size={15} strokeWidth={2} />
										</Flex>
										<Box fontWeight='600' fontSize='md' color='fg.default'>
											{'Import failed'}
										</Box>
									</Flex>
									<Box
										fontSize='xs'
										fontFamily='mono'
										color='fg.default'
										bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
										borderWidth='1px'
										borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
										borderRadius='md'
										p='2.5'
										lineHeight='1.45'
										overflowWrap='anywhere'
									>
										<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.alert' mb='1' fontFamily='body'>
											{'Error message'}
										</Box>
										{state.result.error}
									</Box>
								</Flex>
							)}
							<Flex justify='flex-end' mt='4'>
								<Button size='sm' onClick={onClose}>{'Done'}</Button>
							</Flex>
						</motion.div>
					)}
				</AnimatePresence>
			</Box>
		</Dialog>
	);
};

export default OpenApiImportDialog;
