import React, { useEffect, useRef, useState } from 'react';
import { scaleIn } from '@beak/design-system/animations';
import Button from '@beak/ui/components/atoms/Button';
import Input, { Select } from '@beak/ui/components/atoms/Input';
import { ValueSections } from '@beak/ui/features/variables/values';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditableVariable, UISection } from '@getbeak/types-variables';
import styled from 'styled-components';

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

	if (!editorContext)
		return null;

	const { item, state, parent, variable } = editorContext;
	const boundingRect = parent.getBoundingClientRect();
	const { save } = variable.editor!;

	return (
		<Container onClick={() => close(null)}>
			<Wrapper
				$top={boundingRect.top + parent.clientHeight + 10}
				$left={boundingRect.left - (300 / 2)}
				onClick={event => void event.stopPropagation()}
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

				<ButtonContainer>
					<div>
						{editorContext.variable.external && (
							<React.Fragment>
								<FontAwesomeIcon icon={faWarning} />
								{' This is an extension'}
							</React.Fragment>
						)}
					</div>

					<Button
						size={'sm'}
						colour={'primary'}
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
				</ButtonContainer>
			</Wrapper>
		</Container>
	);
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

const Container = styled.div`
	z-index: 101;
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const Wrapper = styled.div<{ $top: number; $left: number }>`
	position: fixed;
	margin-top: ${p => p.$top}px;
	margin-left: ${p => p.$left}px;

	width: 300px;
	padding: 8px 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};
	z-index: 10000;

	transform-origin: center;
	animation: ${scaleIn} .2s ease;
	transition: transform .1s ease;
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

export default VariableEditor;
