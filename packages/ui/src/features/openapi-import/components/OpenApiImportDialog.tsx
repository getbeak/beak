import Button from '@beak/ui/components/atoms/Button';
import Input from '@beak/ui/components/atoms/Input';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagon, CheckCircle2, FolderPlus, FolderTree } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { importOpenApi } from '../import-action';
import { pickSpecFile } from '../pick-file';
import { actions } from '../store';

// Empty default — the user picks the path verbatim. Submitting blank
// drops the requests straight under `tree/`; typing `users-api` drops them
// under `tree/users-api/`. No automatic `_schemas/` or `openapi/` prefix.
const DEFAULT_FOLDER = '';
const ChakraButton = chakra('button');

const OpenApiImportDialog: React.FC = () => {
	const dispatch = useDispatch();
	const state = useAppSelector(s => s.features.openApiImport);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const [folderInput, setFolderInput] = useState(state.targetFolder || DEFAULT_FOLDER);
	// Local-only — not persisted to the store. The user picks per-import; the
	// `_collection.json` records nothing about it, so re-syncing with the
	// same toggle keeps everything stable.
	const [groupByPath, setGroupByPath] = useState(false);

	const folders = useMemo(() => {
		if (!projectTree) return [];
		return Object.values(projectTree)
			.filter(n => n.type === 'folder')
			.map(n => n.filePath)
			.sort((a, b) => a.localeCompare(b));
	}, [projectTree]);

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

	useEffect(() => {
		if (state.phase !== 'importing' || !state.file) return;
		let cancelled = false;
		importOpenApi({
			source: state.file.source,
			filename: state.file.filename,
			targetFolder: state.targetFolder,
			groupByPath,
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
	}, [state.phase, state.file, state.targetFolder, groupByPath, dispatch]);

	useEffect(() => {
		if (state.phase === 'picking-folder') setFolderInput(state.targetFolder || DEFAULT_FOLDER);
	}, [state.phase, state.targetFolder]);

	if (state.phase === 'idle' || state.phase === 'picking-file') return null;

	function onSubmitFolder() {
		dispatch(actions.folderChosen({ targetFolder: resolveTarget(folderInput) }));
	}

	function onClose() {
		dispatch(actions.close());
	}

	// Submit blank → root of the tree. Anything else gets `tree/` prepended
	// unless the user has already done it. Leading slashes are stripped so
	// `/users-api` lands at `tree/users-api`, not `tree//users-api`.
	const resolvedTarget = resolveTarget(folderInput);

	return (
		<Dialog onClose={onClose}>
			<Box minW='460px' maxW='540px'>
				<AnimatePresence mode='wait'>
					{state.phase === 'picking-folder' && (
						<motion.div
							key='folder'
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.14 }}
						>
							<DialogHeader
								icon={<FolderTree size={14} strokeWidth={2.2} />}
								title='Import OpenAPI spec'
								description={
									state.file?.filename ? `Importing ${state.file.filename}` : 'Choose where the imported spec should land.'
								}
							/>
							<DialogBody>
								<Flex direction='column' gap='3'>
									<Flex direction='column' gap='1'>
										<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
											{'Target folder'}
										</Box>
										<Input
											$beakSize='md'
											value={folderInput}
											placeholder='leave blank for the project root, or type e.g. users-api'
											onChange={e => setFolderInput(e.currentTarget.value)}
											onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													onSubmitFolder();
												}
											}}
										/>
										<Box fontSize='11px' color='fg.subtle'>
											{'Saves to '}
											<Box as='span' fontFamily='mono' color='fg.default'>
												{displayTarget(resolvedTarget)}
											</Box>
										</Box>
									</Flex>

									<Flex
										as='label'
										align='flex-start'
										gap='2'
										cursor='pointer'
										fontSize='xs'
										color='fg.muted'
										px='1'
										py='1'
										borderRadius='md'
										_hover={{ color: 'fg.default' }}
									>
										<input
											type='checkbox'
											checked={groupByPath}
											onChange={e => setGroupByPath(e.currentTarget.checked)}
											style={{ marginTop: '2px' }}
										/>
										<Box>
											<Box fontWeight='600' color='fg.default'>
												{'Group by URL path'}
											</Box>
											<Box fontSize='10px' color='fg.subtle' mt='0.5'>
												{'Mirror the URL hierarchy in the tree — '}
												<Box as='span' fontFamily='mono'>
													{'/api/agents/{id}'}
												</Box>
												{' lands under '}
												<Box as='span' fontFamily='mono'>
													{'api/agents/'}
												</Box>
												{' instead of all in one folder.'}
											</Box>
										</Box>
									</Flex>

									{folders.length > 0 && (
										<Flex direction='column' gap='1'>
											<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
												{'Existing folders'}
											</Box>
											<Box
												maxH='180px'
												overflowY='auto'
												borderRadius='md'
												borderWidth='1px'
												borderColor='border.subtle'
												bg='bg.canvas'
											>
												{folders.map(p => {
													const isPicked = folderInput === p;
													return (
														<ChakraButton
															key={p}
															type='button'
															display='flex'
															alignItems='center'
															gap='1.5'
															w='100%'
															textAlign='left'
															bg={isPicked ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : 'transparent'}
															border='none'
															px='2'
															py='1'
															fontSize='xs'
															fontFamily='mono'
															color={isPicked ? 'fg.default' : 'fg.muted'}
															cursor='pointer'
															_hover={{
																bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
																color: 'fg.default',
															}}
															onClick={() => setFolderInput(p)}
														>
															<FolderTree size={10} />
															<Box overflow='hidden' textOverflow='ellipsis'>
																{p}
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
														color: 'fg.default',
													}}
													onClick={() => setFolderInput('')}
												>
													<FolderPlus size={10} />
													<Box>{'Drop at project root'}</Box>
												</ChakraButton>
											</Box>
										</Flex>
									)}
								</Flex>
							</DialogBody>
							<DialogFooter>
								<Button colour='secondary' size='sm' onClick={onClose}>
									{'Cancel'}
								</Button>
								<Button size='sm' onClick={onSubmitFolder}>
									{'Import'}
								</Button>
							</DialogFooter>
						</motion.div>
					)}

					{state.phase === 'importing' && (
						<motion.div key='importing' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<DialogHeader
								icon={
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 1.1, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
										style={{ display: 'inline-flex' }}
									>
										<FolderTree size={14} strokeWidth={2.2} />
									</motion.div>
								}
								title='Importing OpenAPI spec'
								description={`→ ${state.targetFolder}`}
							/>
							<DialogBody>
								<Box
									role='status'
									aria-live='polite'
									aria-label='Importing OpenAPI spec'
									fontSize='sm'
									color='fg.muted'
									textAlign='center'
									py='2'
								>
									{'Reading routes, writing collection…'}
								</Box>
							</DialogBody>
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
								<React.Fragment>
									<DialogHeader
										icon={<CheckCircle2 size={14} strokeWidth={2.2} />}
										title='OpenAPI imported'
										description={`Saved to ${state.targetFolder}`}
									/>
									<DialogBody>
										<Box fontSize='sm' color='fg.default' lineHeight='1.55'>
											{state.result.notice ?? 'The collection is ready to edit in the project tree.'}
										</Box>
									</DialogBody>
								</React.Fragment>
							) : (
								<React.Fragment>
									<DialogHeader
										icon={<AlertOctagon size={14} strokeWidth={2.2} />}
										title='Import failed'
										description='OpenAPI import didn’t complete.'
									/>
									<DialogBody>
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
											{state.result.error}
										</Box>
									</DialogBody>
								</React.Fragment>
							)}
							<DialogFooter>
								<Button size='sm' onClick={onClose}>
									{'Done'}
								</Button>
							</DialogFooter>
						</motion.div>
					)}
				</AnimatePresence>
			</Box>
		</Dialog>
	);
};

function resolveTarget(input: string): string {
	const trimmed = input.trim().replace(/^\/+/, '').replace(/\/+$/, '');
	if (!trimmed) return 'tree';
	if (trimmed === 'tree' || trimmed.startsWith('tree/')) return trimmed;
	return `tree/${trimmed}`;
}

/** User-facing version of a resolved target: drops the internal `tree/` prefix. */
function displayTarget(resolved: string): string {
	if (resolved === 'tree') return 'project root';
	if (resolved.startsWith('tree/')) return resolved.slice('tree/'.length);
	return resolved;
}

export default OpenApiImportDialog;
