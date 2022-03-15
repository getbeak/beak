import Input, { Select } from '@beak/app/components/atoms/Input';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getRealtimeValue } from '../../realtime-values';
import { RealtimeValue, UISection } from '../../realtime-values/types';

interface RtvEditorContext {
	realtimeValue: RealtimeValue<any, any>;
	item: any;
	parent: HTMLDivElement;
	partIndex: number;
	state: Record<string, string>;
}

interface RealtimeValueEditorProps {
	editable: HTMLDivElement;
	onSave: (partIndex: number, type: string, item: any) => void;
}

const RealtimeValueEditor: React.FunctionComponent<RealtimeValueEditorProps> = props => {
	const { editable, onSave } = props;
	const initialInputRef = useRef<HTMLElement | null>(null);

	const [editorContext, setEditorContext] = useState<RtvEditorContext>();
	const { variableGroups } = useSelector(s => s.global.variableGroups);
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const context = { selectedGroups, variableGroups };

	useEffect(() => {
		if (editorContext)
			initialInputRef.current?.focus();
	}, [editorContext]);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as HTMLDivElement;

			if (target.className !== 'bvs-blob')
				return;

			const { index, type, payload } = target.dataset;

			if (!type)
				return;

			const realtimeValue = getRealtimeValue(type);

			if (!realtimeValue.editor)
				return;

			const item = JSON.parse(payload!);
			const partIndex = Number(index!);

			realtimeValue.editor.load(context, item)
				.then(state => setEditorContext({
					realtimeValue,
					item,
					parent: target,
					partIndex,
					state,
				}))
				// eslint-disable-next-line no-console
				.catch(console.error);
		};

		editable.addEventListener('click', onClick);

		return () => {
			editable.removeEventListener('click', onClick);
		};
	}, [editorContext]);

	function updateState(delta: Record<string, string>) {
		if (!editorContext)
			return;

		setEditorContext({
			...editorContext,
			state: {
				...editorContext.state,
				...delta,
			},
		});
	}

	function close(item: any | null) {
		if (editorContext && item)
			onSave(editorContext.partIndex, editorContext.realtimeValue.type, item);

		setEditorContext(void 0);
	}

	function renderUiSection(section: UISection<unknown>, first: boolean) {
		switch (section.type) {
			case 'string_input':
				return (
					<FormGroup key={`${section.stateBinding}`}>
						{section.label && <Label>{section.label}</Label>}
						<Input
							ref={i => trySetInitialRef(first, i, initialInputRef)}
							beakSize={'sm'}
							type={'text'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => updateState({
								[section.stateBinding]: e.currentTarget.value,
							})}
						/>
					</FormGroup>
				);

			case 'number_input':
				return (
					<FormGroup key={`${section.stateBinding}`}>
						{section.label && <Label>{section.label}</Label>}
						<Input
							ref={i => trySetInitialRef(first, i, initialInputRef)}
							beakSize={'sm'}
							type={'number'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => updateState({
								[section.stateBinding]: e.currentTarget.value,
							})}
						/>
					</FormGroup>
				);

			case 'options_input':
				return (
					<FormGroup key={`${section.stateBinding}`}>
						{section.label && <Label>{section.label}</Label>}
						<Select
							ref={i => trySetInitialRef(first, i, initialInputRef)}
							beakSize={'sm'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => updateState({
								[section.stateBinding]: e.currentTarget.value,
							})}
						>
							{section.options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
						</Select>
					</FormGroup>
				);

			default:
				return null;
		}
	}

	if (!editorContext)
		return null;

	const { item, state, parent, realtimeValue } = editorContext;
	const boundingRect = parent.getBoundingClientRect();
	const { save, ui } = realtimeValue.editor!;

	return (
		<Container onClick={() => close(null)}>
			<Wrapper
				$top={boundingRect.top + parent.clientHeight + 25}
				$left={boundingRect.left - (300 / 2)}
				onClick={event => void event.stopPropagation()}
			>
				{ui.map((section, i) => renderUiSection(section, i === 0))}

				<ButtonContainer>
					<Button onClick={() => {
						save(context, item, state).then(updatedItem => close(updatedItem));
					}}>
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
`;

const FormGroup = styled.div`
	margin-bottom: 8px;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 4px;

	font-size: 13px;
`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: row-reverse;
`;

const Button = styled.button`
	background: none;
	border: none;
	font-weight: 600;
	color: ${p => p.theme.ui.textOnAction};
	cursor: pointer;

	&:hover {
		color: ${p => p.theme.ui.textOnFill};
	}
`;

export default RealtimeValueEditor;
