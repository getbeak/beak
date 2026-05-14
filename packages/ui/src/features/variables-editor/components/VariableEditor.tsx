import Button from '@beak/ui/components/atoms/Button';
import Input, { Select } from '@beak/ui/components/atoms/Input';
import Kbd from '@beak/ui/components/atoms/Kbd';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Puzzle } from 'lucide-react';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

const MotionBox = motion.create(Box);

import type { EditableVariable, UISection } from '@getbeak/extension-sdk';

import VariableInput from '../../variable-input/components/VariableInput';
import { VariableManager } from '../../variables';
import useVariableContext from '../../variables/hooks/use-variable-context';
import { previewValue } from '../../variables/preview';
import renderRequestSelectOptions from '../utils/render-request-select-options';
import { FormGroup, Label } from './atoms/Form';
import PreviewContainer from './molecules/PreviewContainer';

interface VariableEditorContext {
	variable: EditableVariable<any, any>;
	item: any;
	parent: HTMLDivElement;
	partIndex: number;
	state: Record<string, unknown>;
}

interface VariableEditorProps {
	requestId?: string;
	editable: HTMLDivElement;
	onSave: (partIndex: number, type: string, item: any) => void;
}

const EDITOR_WIDTH = 340;
const EDITOR_VIEWPORT_MARGIN = 12;

const VariableEditor: React.FC<React.PropsWithChildren<VariableEditorProps>> = props => {
	const { editable, requestId, onSave } = props;
	const initialInputRef = useRef<HTMLElement | null>(null);
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const [editorContext, setEditorContext] = useState<VariableEditorContext>();
	const [uiSections, setUiSections] = useState<UISection<any>[]>([]);
	const [preview, setPreview] = useState('');
	const context = useVariableContext(requestId);
	const windowSession = useContext(WindowSessionContext);
	const isDarwin = windowSession.isDarwin();

	useEffect(() => {
		if (!editorContext || !initialInputRef.current) return;

		initialInputRef.current.focus();
	}, [Boolean(editorContext)]);

	useEffect(() => {
		if (!editorContext) {
			// If the editor context is reset, then we need to reset some more local state
			setUiSections([]);
			setPreview('');

			return void 0;
		}

		let cancelled = false;

		previewValue(context, editorContext.variable, editorContext.item, editorContext.state).then(preview => {
			if (!cancelled) setPreview(preview);
		});

		const { createUserInterface } = editorContext.variable.editor;

		createUserInterface(context).then(sections => {
			if (!cancelled) setUiSections(sections);
		});

		return () => {
			cancelled = true;
		};
	}, [editorContext]);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as HTMLDivElement;

			if (target.className !== 'bvs-blob') return;

			const { index, type, payload } = target.dataset;

			if (!type) return;

			const variable = VariableManager.getVariable(type);

			if (!('editor' in variable)) return;

			if (!variable.editor) return;

			// biome-ignore lint/suspicious/noExplicitAny: matches VariableEditorContext.item's `any` shape — the payload schema is owned by the variable definition
			let item: any;
			try {
				item = JSON.parse(payload!);
			} catch (err) {
				console.warn('variable editor: invalid payload on blob', err);
				return;
			}
			const partIndex = Number(index!);

			if (!variable.editor.load) {
				setEditorContext({
					variable,
					item,
					parent: target,
					partIndex,
					state: item,
				});

				return;
			}

			variable.editor
				.load(context, item)
				.then(state =>
					setEditorContext({
						variable,
						item,
						parent: target,
						partIndex,
						state,
					}),
				)
				.catch(console.error);
		};

		editable.addEventListener('click', onClick);

		return () => {
			editable.removeEventListener('click', onClick);
		};
	}, [editorContext]);

	function updateState(delta: Record<string, unknown>) {
		if (!editorContext) return;

		setEditorContext(editorCtx => ({
			...editorCtx!,
			state: {
				...editorCtx!.state,
				...delta,
			},
		}));
	}

	function close(item: any | null) {
		if (editorContext && item) onSave(editorContext.partIndex, editorContext.variable.type, item);

		setEditorContext(void 0);
	}

	function saveCurrent() {
		if (!editorContext) return;
		const { variable, item, state } = editorContext;
		const { save } = variable.editor!;

		if (!save) {
			close(state);
			return;
		}
		save(context, item, state)
			.then(updatedItem => close(updatedItem))
			.catch(err => {
				console.warn('variable editor: save failed', err);
				close(null);
			});
	}

	useEffect(() => {
		if (!editorContext) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				close(null);
				return;
			}
			const modifierHit = isDarwin ? event.metaKey : event.ctrlKey;
			if (modifierHit && event.key === 'Enter') {
				event.preventDefault();
				saveCurrent();
			}
		}

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [editorContext, isDarwin]);

	return (
		<AnimatePresence>
			{editorContext && (
				<MotionBox
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.12 }}
					position='fixed'
					inset='0'
					zIndex={101}
					bg='color-mix(in srgb, var(--beak-colors-gray-950) 18%, transparent)'
					backdropFilter='blur(2px)'
					onClick={() => close(null)}
				>
					{renderEditor()}
				</MotionBox>
			)}
		</AnimatePresence>
	);

	function renderEditor() {
		if (!editorContext) return null;
		const { item, state, parent, variable } = editorContext;
		const boundingRect = parent.getBoundingClientRect();
		const { save } = variable.editor!;

		// Viewport-clamp the dialog so it never spills off the right edge or
		// drops below the bottom — flip above the blob when it would.
		const desiredLeft = boundingRect.left + boundingRect.width / 2 - EDITOR_WIDTH / 2;
		const maxLeft = window.innerWidth - EDITOR_WIDTH - EDITOR_VIEWPORT_MARGIN;
		const clampedLeft = Math.max(EDITOR_VIEWPORT_MARGIN, Math.min(desiredLeft, maxLeft));

		const spaceBelow = window.innerHeight - boundingRect.bottom;
		const flipAbove = spaceBelow < 280;
		const top = flipAbove ? Math.max(EDITOR_VIEWPORT_MARGIN, boundingRect.top - 12) : boundingRect.bottom + 10;

		const transformOrigin = flipAbove ? 'bottom' : 'top';
		const translateY = flipAbove ? '-100%' : '0';

		const kbdSaveLabel = isDarwin ? '⌘' : 'Ctrl';

		return (
			<MotionBox
				ref={dialogRef as unknown as React.Ref<HTMLDivElement>}
				role='dialog'
				aria-label={`Edit ${variable.name}`}
				initial={{ opacity: 0, scale: 0.96, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: -4 }}
				transition={{ type: 'spring', stiffness: 700, damping: 36 }}
				position='fixed'
				w={`${EDITOR_WIDTH}px`}
				maxH='80vh'
				display='flex'
				flexDirection='column'
				borderRadius='xl'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 24%, var(--beak-colors-border-subtle))'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 72%, transparent)'
				backdropFilter='blur(24px) saturate(180%)'
				boxShadow='0 32px 80px rgba(0,0,0,0.38), 0 12px 32px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, rgba(0,0,0,0.18)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
				zIndex={10000}
				style={{
					top: `${top}px`,
					left: `${clampedLeft}px`,
					transform: `translateY(${translateY})`,
					transformOrigin,
				}}
				onClick={(event: React.MouseEvent) => event.stopPropagation()}
			>
				<Flex
					align='center'
					justify='space-between'
					gap='2'
					px='3'
					py='2'
					borderBottomWidth='1px'
					borderColor='border.subtle'
				>
					<Flex align='center' gap='1.5' minW={0}>
						<Box
							w='6px'
							h='6px'
							borderRadius='full'
							bg='accent.pink'
							boxShadow='0 0 6px color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)'
							flex='0 0 auto'
						/>
						<Box
							fontSize='12px'
							fontWeight='600'
							color='fg.default'
							letterSpacing='-0.005em'
							overflow='hidden'
							textOverflow='ellipsis'
							whiteSpace='nowrap'
						>
							{variable.name}
						</Box>
					</Flex>
					{variable.external && (
						<Flex
							align='center'
							gap='1'
							px='1.5'
							py='0.5'
							borderRadius='sm'
							borderWidth='1px'
							borderStyle='solid'
							fontSize='9px'
							fontWeight='700'
							color='accent.pink'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
							boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
							textTransform='uppercase'
							letterSpacing='0.06em'
							flex='0 0 auto'
						>
							<Puzzle size={9} strokeWidth={2.2} />
							<Box as='span'>{'Extension'}</Box>
						</Flex>
					)}
				</Flex>

				<Box flex='1 1 auto' overflowY='auto' p='3'>
					{uiSections.map((section, i) => {
						const first = i === 0;
						const stateBinding = section.stateBinding as string;

						switch (section.type) {
							case 'value_parts_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<VariableInput
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											parts={state[stateBinding] as ValueSections}
											onChange={e =>
												updateState({
													[stateBinding]: e,
												})
											}
										/>
									</FormGroup>
								);

							case 'string_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<Input
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											$beakSize={'sm'}
											aria-label={section.label ?? stateBinding}
											type={'text'}
											value={(state[stateBinding] as string) || ''}
											onChange={e =>
												updateState({
													[stateBinding]: e.currentTarget.value,
												})
											}
										/>
									</FormGroup>
								);

							case 'checkbox_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<Input
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											$beakSize={'sm'}
											$noStretch
											aria-label={section.label ?? stateBinding}
											type={'checkbox'}
											checked={state[stateBinding] as boolean}
											onChange={e =>
												updateState({
													[stateBinding]: e.currentTarget.checked,
												})
											}
										/>
									</FormGroup>
								);

							case 'number_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<Input
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											$beakSize={'sm'}
											aria-label={section.label ?? stateBinding}
											type={'number'}
											value={Number.isFinite(state[stateBinding] as number) ? (state[stateBinding] as number).toString(10) : ''}
											onChange={e => {
												const raw = e.currentTarget.value;
												const parsed = raw === '' ? 0 : parseInt(raw, 10);
												if (Number.isFinite(parsed)) updateState({ [stateBinding]: parsed });
											}}
										/>
									</FormGroup>
								);

							case 'options_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<Select
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											$beakSize={'sm'}
											aria-label={section.label ?? stateBinding}
											value={(state[stateBinding] as string) ?? ''}
											onChange={e =>
												updateState({
													[stateBinding]: e.currentTarget.value,
												})
											}
										>
											{section.options.map(o => (
												<option key={o.key} value={o.key}>
													{o.label}
												</option>
											))}
										</Select>
									</FormGroup>
								);

							case 'request_select_input':
								return (
									<FormGroup key={stateBinding}>
										{section.label && <Label>{section.label}</Label>}
										<Select
											ref={i => trySetInitialRef(first, i, initialInputRef)}
											$beakSize={'sm'}
											aria-label={section.label ?? stateBinding}
											value={(state[stateBinding] as string) ?? ''}
											onChange={e =>
												updateState({
													[stateBinding]: e.currentTarget.value,
												})
											}
										>
											{renderRequestSelectOptions(context)}
										</Select>
									</FormGroup>
								);

							default:
								return null;
						}
					})}

					<PreviewContainer text={preview} />
				</Box>

				<Flex
					align='center'
					justify='space-between'
					gap='2'
					px='3'
					py='2'
					borderTopWidth='1px'
					borderColor='border.subtle'
					bg='color-mix(in srgb, var(--beak-colors-bg-canvas) 50%, transparent)'
				>
					<Flex align='center' gap='2' fontSize='10px' color='fg.subtle'>
						<Flex align='center' gap='1'>
							<Kbd>{'esc'}</Kbd>
							<Box as='span'>{'close'}</Box>
						</Flex>
						<Flex align='center' gap='1'>
							<Kbd>{kbdSaveLabel}</Kbd>
							<Kbd>{'↵'}</Kbd>
							<Box as='span'>{'save'}</Box>
						</Flex>
					</Flex>
					<Flex gap='2'>
						<Button size='sm' colour='secondary' onClick={() => close(null)}>
							{'Cancel'}
						</Button>
						<Button
							size='sm'
							colour='primary'
							onClick={() => {
								if (!save) {
									close(state);
									return;
								}
								save(context, item, state)
									.then(updatedItem => close(updatedItem))
									.catch(err => {
										console.warn('variable editor: save failed', err);
										close(null);
									});
							}}
						>
							{'Save'}
						</Button>
					</Flex>
				</Flex>
			</MotionBox>
		);
	}
};

function trySetInitialRef(
	first: boolean,
	instance: HTMLElement | null,
	ref: React.MutableRefObject<HTMLElement | null>,
) {
	if (!first) return;

	ref.current = instance;
}

export default VariableEditor;
