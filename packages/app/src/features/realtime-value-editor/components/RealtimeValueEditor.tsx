import Input, { Select } from '@beak/app/components/atoms/Input';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RealtimeValue, UISection } from '../../variable-input/realtime-values/types';

interface RealtimeValueEditorProps {
	realtimeValue: RealtimeValue<any, any>;
	item: Record<string, unknown>;
	parent: HTMLDivElement;

	onClose: (item: any | null) => void;
}

const RealtimeValueEditor: React.FunctionComponent<RealtimeValueEditorProps> = props => {
	const [state, setState] = useState<Record<string, string>>({});
	const [ready, setReady] = useState(false);
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const { realtimeValue, item, parent } = props;
	const editor = realtimeValue.editor!;
	const { load, save, ui } = editor;
	const context = { projectPath, selectedGroups, variableGroups };

	useEffect(() => {
		load(context, item).then(state => {
			setState(state);
			setReady(true);
		}).catch(console.error);
	}, []);

	if (!ready)
		return null;

	function renderUiSection(section: UISection<any>) {
		switch (section.type) {
			case 'string_input':
				return (
					<FormGroup>
						{section.label && <Label>{section.label}</Label>}
						<Input
							beakSize={'sm'}
							type={'text'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => setState({
								...(state),
								[section.stateBinding]: e.currentTarget.value,
							})}
						/>
					</FormGroup>
				);

			case 'number_input':
				return (
					<FormGroup>
						{section.label && <Label>{section.label}</Label>}
						<Input
							beakSize={'sm'}
							type={'number'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => setState({
								...(state),
								[section.stateBinding]: e.currentTarget.value,
							})}
						/>
					</FormGroup>
				);

			case 'options_input':
				return (
					<FormGroup>
						{section.label && <Label>{section.label}</Label>}
						<Select
							beakSize={'sm'}
							value={state[section.stateBinding as string] || ''}
							onChange={e => setState({
								...(state),
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

	const boundingRect = parent.getBoundingClientRect();

	return (
		<Container onClick={() => props.onClose(null)}>
			<Wrapper
				top={boundingRect.top + parent.clientHeight + 5}
				left={boundingRect.left - (300 / 2)}
				onClick={event => void event.stopPropagation()}
			>
				{ui.map(section => renderUiSection(section))}

				<ButtonContainer>
					<Button onClick={() => {
						save(context, item, state).then(updatedItem => props.onClose(updatedItem));
					}}>
						{'Save'}
					</Button>
				</ButtonContainer>
			</Wrapper>
		</Container>
	);
};

const Container = styled.div`
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const Wrapper = styled.div<{ top: number; left: number }>`
	position: fixed;
	margin-top: ${p => p.top}px;
	margin-left: ${p => p.left}px;

	width: 300px;
	padding: 8px 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};
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
