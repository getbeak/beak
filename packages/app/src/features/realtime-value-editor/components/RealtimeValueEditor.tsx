import React, { useEffect, useState } from 'react';
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
	const { realtimeValue, item, parent } = props;
	const editor = realtimeValue.editor!;
	const { load, save, ui } = editor;

	useEffect(() => {
		load(item).then(state => {
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
						<Label>{section.label}</Label><br />
						<Input
							value={state[section.stateBinding as string] || ''}
							onChange={e => setState({
								...(state),
								[section.stateBinding]: e.currentTarget.value,
							})}
						/>
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

			<Button
				onClick={() => {
					save(item, state).then(updatedItem => props.onClose(updatedItem));
				}}>
				{'Save!'}
			</Button>
		</Wrapper>
	);
};

const Wrapper = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${p => p.top}px;
	left: ${p => p.left}px;

	width: 300px;
	padding: 5px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	background: ${p => p.theme.ui.surface};
`;

const FormGroup = styled.div`

`;

const Label = styled.label`

`;

const Input = styled.input`

`;

const Button = styled.button`

`;

export default RealtimeValueEditor;
