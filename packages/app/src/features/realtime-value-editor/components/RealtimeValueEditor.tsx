import React, { useEffect, useRef, useState } from 'react';
import Input, { Select } from '@beak/app/components/atoms/Input';
import { ValueParts } from '@beak/common/types/beak-project';
import styled from 'styled-components';

import { getRealtimeValue } from '../../realtime-values';
import useRealtimeValueContext from '../../realtime-values/hooks/use-realtime-value-context';
import { RealtimeValue } from '../../realtime-values/types';
import VariableInput from '../../variable-input/components/VariableInput';

interface RtvEditorContext {
	realtimeValue: RealtimeValue<any, any>;
	item: any;
	parent: HTMLDivElement;
	partIndex: number;
	state: Record<string, unknown>;
}

interface RealtimeValueEditorProps {
	requestId?: string;
	editable: HTMLDivElement;
	onSave: (partIndex: number, type: string, item: any) => void;
}

const RealtimeValueEditor: React.FC<React.PropsWithChildren<RealtimeValueEditorProps>> = props => {
	const { editable, requestId, onSave } = props;
	const initialInputRef = useRef<HTMLElement | null>(null);
	const [editorContext, setEditorContext] = useState<RtvEditorContext>();
	const context = useRealtimeValueContext(requestId);

	useEffect(() => {
		if (editorContext)
			initialInputRef.current?.focus();
	}, [Boolean(editorContext)]);

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

	function updateState(delta: Record<string, unknown>) {
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

	if (!editorContext)
		return null;

	const { item, state, parent, realtimeValue } = editorContext;
	const boundingRect = parent.getBoundingClientRect();
	const { save, ui } = realtimeValue.editor!;

	return (
		<Container onClick={() => close(null)}>
			<Wrapper
				$top={boundingRect.top + parent.clientHeight + 10}
				$left={boundingRect.left - (300 / 2)}
				onClick={event => void event.stopPropagation()}
			>
				{ui.map((section, i) => {
					const first = i === 0;
					const stateBinding = section.stateBinding as string;

					switch (section.type) {
						case 'value_parts_input':
							return (
								<FormGroup key={`${stateBinding}`}>
									{section.label && <Label>{section.label}</Label>}
									<VariableInput
										ref={i => trySetInitialRef(first, i, initialInputRef)}
										parts={state[stateBinding] as ValueParts}
										onChange={e => updateState({
											[stateBinding]: e,
										})}
									/>
								</FormGroup>
							);

						case 'string_input':
							return (
								<FormGroup key={`${stateBinding}`}>
									{section.label && <Label>{section.label}</Label>}
									<Input
										ref={i => trySetInitialRef(first, i, initialInputRef)}
										beakSize={'sm'}
										type={'text'}
										value={state[stateBinding] as string || ''}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.value,
										})}
									/>
								</FormGroup>
							);

						case 'number_input':
							return (
								<FormGroup key={`${stateBinding}`}>
									{section.label && <Label>{section.label}</Label>}
									<Input
										ref={i => trySetInitialRef(first, i, initialInputRef)}
										beakSize={'sm'}
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
								<FormGroup key={`${stateBinding}`}>
									{section.label && <Label>{section.label}</Label>}
									<Select
										ref={i => trySetInitialRef(first, i, initialInputRef)}
										beakSize={'sm'}
										value={state[stateBinding] as string ?? ''}
										onChange={e => updateState({
											[stateBinding]: e.currentTarget.value,
										})}
									>
										{section.options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
									</Select>
								</FormGroup>
							);

						default:
							return null;
					}
				})}

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

	> div > article {
		font-size: 13px;
		padding: 3px 5px;
		padding-bottom: 4px;
		border-radius: 3px;
	}
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
