import Button from '@beak/ui/components/atoms/Button';
import Input, { Select } from '@beak/ui/components/atoms/Input';
import Kbd from '@beak/ui/components/atoms/Kbd';
import Popover, { PopoverBody, PopoverFooter, PopoverHeader } from '@beak/ui/components/molecules/Popover';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, Flex } from '@chakra-ui/react';
import type { EditableVariable, UISection } from '@getbeak/extension-sdk';
import { Puzzle } from 'lucide-react';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import VariableInput from '../../variable-input/components/VariableInput';
import { VariableManager } from '../../variables';
import useVariableContext from '../../variables/hooks/use-variable-context';
import { previewValue } from '../../variables/preview';
import renderRequestSelectOptions from '../utils/render-request-select-options';
import { FormGroup, Label } from './atoms/Form';
import PreviewContainer from './molecules/PreviewContainer';

interface VariableEditorContext {
	// biome-ignore lint/suspicious/noExplicitAny: variable editor is generic over the extension's own state shape
	variable: EditableVariable<any, any>;
	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by the variable definition
	item: any;
	parent: HTMLDivElement;
	partIndex: number;
	state: Record<string, unknown>;
}

interface VariableEditorProps {
	requestId?: string;
	editable: HTMLDivElement;
	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by the variable definition
	onSave: (partIndex: number, type: string, item: any) => void;
}

const EDITOR_WIDTH = 340;

const VariableEditor: React.FC<React.PropsWithChildren<VariableEditorProps>> = ({ editable, requestId, onSave }) => {
	const initialInputRef = useRef<HTMLElement | null>(null);
	const [editorContext, setEditorContext] = useState<VariableEditorContext>();
	// biome-ignore lint/suspicious/noExplicitAny: UI sections accept arbitrary editor state shapes
	const [uiSections, setUiSections] = useState<UISection<any>[]>([]);
	const [preview, setPreview] = useState('');
	const context = useVariableContext(requestId);
	const windowSession = useContext(WindowSessionContext);
	const isDarwin = windowSession.isDarwin();

	useEffect(() => {
		if (!editorContext || !initialInputRef.current) return;
		initialInputRef.current.focus();
	}, [editorContext]);

	useEffect(() => {
		if (!editorContext) {
			setUiSections([]);
			setPreview('');
			return;
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
	}, [editorContext, context]);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as HTMLDivElement;
			if (target.className !== 'bvs-blob') return;

			const { index, type, payload } = target.dataset;
			if (!type) return;

			const variable = VariableManager.getVariable(type);
			if (!('editor' in variable)) return;
			if (!variable.editor) return;

			// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by the variable definition
			let item: any;
			try {
				item = JSON.parse(payload!);
			} catch (err) {
				console.warn('variable editor: invalid payload on blob', err);
				return;
			}
			const partIndex = Number(index!);

			if (!variable.editor.load) {
				setEditorContext({ variable, item, parent: target, partIndex, state: item });
				return;
			}

			variable.editor
				.load(context, item)
				.then(state => setEditorContext({ variable, item, parent: target, partIndex, state }))
				.catch(console.error);
		};

		editable.addEventListener('click', onClick);
		return () => editable.removeEventListener('click', onClick);
	}, [editable, context]);

	function updateState(delta: Record<string, unknown>) {
		if (!editorContext) return;
		setEditorContext(editorCtx => ({
			...editorCtx!,
			state: { ...editorCtx!.state, ...delta },
		}));
	}

	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by the variable definition
	function close(item: any | null) {
		if (editorContext && item) onSave(editorContext.partIndex, editorContext.variable.type, item);
		setEditorContext(undefined);
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
			const modifierHit = isDarwin ? event.metaKey : event.ctrlKey;
			if (modifierHit && event.key === 'Enter') {
				event.preventDefault();
				saveCurrent();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [editorContext, isDarwin]);

	if (!editorContext) return null;

	const { item, state, parent, variable } = editorContext;
	const { save } = variable.editor!;
	const kbdSaveLabel = isDarwin ? '⌘' : 'Ctrl';

	return (
		<Popover
			anchor={parent}
			onClose={() => close(null)}
			width={EDITOR_WIDTH}
			placement='bottom'
			align='center'
			ariaLabel={`Edit ${variable.name}`}
		>
			<PopoverHeader
				title={variable.name}
				trailing={
					variable.external ? (
						<Flex
							align='center'
							gap='1'
							px='1.5'
							py='0.5'
							borderRadius='sm'
							borderWidth='1px'
							fontSize='9px'
							fontWeight='700'
							color='accent.pink'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
							textTransform='uppercase'
							letterSpacing='0.06em'
						>
							<Puzzle size={9} strokeWidth={2.2} />
							<Box as='span'>{'Extension'}</Box>
						</Flex>
					) : null
				}
			/>

			<PopoverBody>
				{uiSections.map((section, i) => {
					const first = i === 0;
					const stateBinding = section.stateBinding as string;

					switch (section.type) {
						case 'value_parts_input':
							return (
								<FormGroup key={stateBinding}>
									{section.label && <Label>{section.label}</Label>}
									<VariableInput
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										parts={state[stateBinding] as ValueSections}
										onChange={e => updateState({ [stateBinding]: e })}
									/>
								</FormGroup>
							);
						case 'string_input':
							return (
								<FormGroup key={stateBinding}>
									{section.label && <Label>{section.label}</Label>}
									<Input
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										$beakSize={'sm'}
										aria-label={section.label ?? stateBinding}
										type='text'
										value={(state[stateBinding] as string) || ''}
										onChange={e => updateState({ [stateBinding]: e.currentTarget.value })}
									/>
								</FormGroup>
							);
						case 'checkbox_input':
							return (
								<FormGroup key={stateBinding}>
									{section.label && <Label>{section.label}</Label>}
									<Input
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										$beakSize={'sm'}
										$noStretch
										aria-label={section.label ?? stateBinding}
										type='checkbox'
										checked={state[stateBinding] as boolean}
										onChange={e => updateState({ [stateBinding]: e.currentTarget.checked })}
									/>
								</FormGroup>
							);
						case 'number_input':
							return (
								<FormGroup key={stateBinding}>
									{section.label && <Label>{section.label}</Label>}
									<Input
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										$beakSize={'sm'}
										aria-label={section.label ?? stateBinding}
										type='number'
										value={Number.isFinite(state[stateBinding] as number) ? (state[stateBinding] as number).toString(10) : ''}
										onChange={e => {
											const raw = e.currentTarget.value;
											const parsed = raw === '' ? 0 : Number.parseInt(raw, 10);
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
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										$beakSize={'sm'}
										aria-label={section.label ?? stateBinding}
										value={(state[stateBinding] as string) ?? ''}
										onChange={e => updateState({ [stateBinding]: e.currentTarget.value })}
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
										ref={el => trySetInitialRef(first, el, initialInputRef)}
										$beakSize={'sm'}
										aria-label={section.label ?? stateBinding}
										value={(state[stateBinding] as string) ?? ''}
										onChange={e => updateState({ [stateBinding]: e.currentTarget.value })}
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
			</PopoverBody>

			<PopoverFooter
				leading={
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
				}
			>
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
			</PopoverFooter>
		</Popover>
	);
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
