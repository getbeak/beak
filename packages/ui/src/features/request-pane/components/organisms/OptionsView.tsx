import React from 'react';
import { useDispatch } from 'react-redux';
import { actions } from '@beak/ui/store/project';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import styled from 'styled-components';

export interface OptionsViewProps {
	node: ValidRequestNode;
}

const OptionsView: React.FC<React.PropsWithChildren<OptionsViewProps>> = props => {
	const { node } = props;
	const options = node.info.options;
	const dispatch = useDispatch();

	return (
		<Container>
			<OptionRow>
				<Label htmlFor={'followRedirects'}>{'Follow redirects'}</Label>
				<Checkbox
					name={'followRedirects'}
					type={'checkbox'}
					checked={options.followRedirects}
					onChange={e => dispatch(actions.requestOptionFollowRedirects({
						requestId: node.id,
						followRedirects: e.target.checked,
					}))}
				/>
			</OptionRow>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding: 15px 20px;
	height: calc(100% - 40px);
`;

const OptionRow = styled.div`
	padding: 10px 0;
`;

const Label = styled.label`
	display: block;
	font-size: 14px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const Checkbox = styled.input`
	margin-left: 0px;
`;

export default OptionsView;
