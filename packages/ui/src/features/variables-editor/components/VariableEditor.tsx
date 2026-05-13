import { Box, Flex } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import Button from '@beak/ui/components/atoms/Button';
import Input, { Select } from '@beak/ui/components/atoms/Input';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Puzzle } from 'lucide-react';

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

const VariableEditor: React.FC<React.PropsWithChildren<VariableEditorProps>> = props => {
	const { editable, requestId, onSave } = props;
	const initialInputRef = useRef<HTMLElement | null>(null);
	const [editorContext, setEditorContext] = useState<VariableEditorContext>();
	const [uiSections, setUiSections] = useState<UISection<any>[]>([]);
	const [preview, setPreview] = useState('');
	const context = useVariableContext(requestId);

	useEffect(() => {
		if (!editorContext || !initialInputRef.current)
			return;

		initialInputRef.current.focus();
	}, [Boolean(editorContext)]);

	useEffect(() => {
		if (!editorContext) {
			// If the editor context is reset, then we need to reset some more local state
			setUiSections([]);
			setPreview('');

			return;
		}

		previewValue(context, editorContext.variable, editorContext.item, editorContext.state)
			.then(setPreview);

		const { createUserInterface } = editorContext.variable.editor;

		createUserInterface(context).then(setUiSections);
	}, [editorContext]);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as HTMLDivElement;

			if (target.className !== 'bvs-blob')
				return;

			const { index, type, payload } = target.dataset;

			if (!type)
				return;

			const variable = VariableManager.getVariable(type);

			if (!('editor' in variable))
				return;

			if (!variable.editor)
				return;

			const item = JSON.parse(payload!);
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

			variable.editor.load(context, item)
				.then(state => setEditorContext({
					variable,
					item,
					parent: target,
					partIndex,
					state,
				}))
				.catch(console.error);
		};

		editable.addEventListener('click', onClick);

		return () => {
			editable.removeEventListener('click', onClick);
		};
	}, [editorContext]);

	function updateState(delta: Record<string, unknown>) {
		if (!editorContext)
			return;

		setEditorContext(editorCtx => ({
			...editorCtx!,
			state: {
				...editorCtx!.state,
				...delta,
			},
		}));
	}

	function close(item: any | null) {
		if (editorContext && item)
			onSave(editorContext.partIndex, editorContext.variable.type, item);

		setEditorContext(void 0);
	}

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

		return (
			<MotionBox
				initial={{ opacity: 0, scale: 0.96, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: -4 }}
				transition={{ type: 'spring', stiffness: 700, damping: 36 }}
				position='fixed'
				w='340px'
				p='3'
				borderRadius='xl'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 24%, var(--beak-colors-border-subtle))'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
				backdropFilter='blur(24px) saturate(180%)'
				boxShadow='0 32px 80px rgba(0,0,0,0.38), 0 12px 32px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, rgba(0,0,0,0.18)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
				zIndex={10000}
				style={{
					marginTop: `${boundingRect.top + parent.clientHeight + 10}px`,
					marginLeft: `${boundingRect.left - 340 / 2}px`,
				}}
				onClick={(event: React.MouseEvent) => event.stopPropagation()}
			>
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
										onChange={e => updateState({
											[stateBinding]: e,
										})}
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
										type={'text'}
										value={state[stateBinding] as string || ''}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.value,
										})}
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
										type={'checkbox'}
										checked={state[stateBinding] as boolean}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.checked,
										})}
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
										type={'number'}
										value={(state[stateBinding] as number).toString(10)}
										onChange={e => updateState({
											[stateBinding]: parseInt(e.currentTarget.value, 10),
										})}
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
										value={state[stateBinding] as string ?? ''}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.value,
										})}
									>
										{section.options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
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
										value={state[stateBinding] as string ?? ''}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.value,
										})}
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

				<Flex justify='space-between' align='center' mt='2'>
					<Box minW={0} flex='1 1 auto'>
						{variable.external && (
							<Flex
								align='center'
								gap='1'
								fontSize='10px'
								fontWeight='600'
								color='accent.pink'
								textTransform='uppercase'
								letterSpacing='0.06em'
								data-tooltip-id='tt-variable-input-extension'
							>
								<Puzzle size={10} />
								<Box as='span'>{'Extension'}</Box>
							</Flex>
						)}
					</Box>

					<Button
						size='sm'
						colour='primary'
						onClick={() => {
							if (!save) {
								close(state);
								return;
							}
							save(context, item, state).then(updatedItem => close(updatedItem));
						}}
					>
						{'Save'}
					</Button>
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
	if (!first)
		return;

	// eslint-disable-next-line no-param-reassign
	ref.current = instance;
}

export default VariableEditor;
