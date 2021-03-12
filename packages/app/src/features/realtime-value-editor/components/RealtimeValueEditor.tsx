import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RealtimeValue, UISection } from '../../variable-input/realtime-values/types';

interface RealtimeValueEditorProps {
	realtimeValue: RealtimeValue<any, any>;
	item: Record<string, unknown>;
	parent: HTMLDivElement;

	onClose: (item: any) => void;
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
						{section.label && (
							<React.Fragment>
								<Label>{section.label}</Label>
								<br />
							</React.Fragment>
						)}
						<Input
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
						{section.label && (
							<React.Fragment>
								<Label>{section.label}</Label>
								<br />
							</React.Fragment>
						)}
						<Input
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
						{section.label && (
							<React.Fragment>
								<Label>{section.label}</Label>
								<br />
							</React.Fragment>
						)}
						<Select
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
		<Wrapper
			top={boundingRect.top + parent.clientHeight + 5}
			left={boundingRect.left - (300 / 2)}
		>
			{ui.map(section => renderUiSection(section))}

			<ButtonContainer>
				<Button
					onClick={() => {
						save(context, item, state).then(updatedItem => props.onClose(updatedItem));
					}}>
					{'Save!'}
				</Button>
			</ButtonContainer>
		</Wrapper>
	);
};

const Wrapper = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${p => p.top}px;
	left: ${p => p.left}px;

	width: 300px;
	padding: 8px 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};
`;

const FormGroup = styled.div`

`;

const Label = styled.label`

`;

const Input = styled.input`

`;

const Select = styled.select`

`;

const ButtonContainer = styled.div`
	display: flex;
	flex-direction: row-reverse;
`;

const Button = styled.button`
	background: none;
	border: none;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
	cursor: pointer;

	&:hover {
		color: ${p => p.theme.ui.textMinorMuted};
	}
`;

export default RealtimeValueEditor;
