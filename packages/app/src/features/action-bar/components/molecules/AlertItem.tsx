import React from 'react';
import Button from '@beak/app/components/atoms/Button';
import styled from 'styled-components';

interface AlertItemProps {
	title: string;
	description: string;
	action?: {
		cta: string;
		callback: () => void;
	};
}

const AlertItem: React.FunctionComponent<React.PropsWithChildren<AlertItemProps>> = props => {
	const { title, description, action } = props;

	return (
		<Container>
			<Title>{title}</Title>
			<Description>{description}</Description>
			{action && (
				<Action>
					<Button size={'sm'} onClick={action.callback}>
						{action.cta}
					</Button>
				</Action>
			)}
		</Container>
	);
};

const Container = styled.div`
	display: grid;
	grid-template-columns: auto min-content;
	grid-template-rows: auto auto;

	padding: 8px 12px;
	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};

	&:last-of-type {
		border: none;
	}
`;

const Title = styled.div`
	grid-row: 1;
	grid-column: 1;

	font-size: 14px;
`;

const Description = styled.div`
	grid-row: 2;
	grid-column: 1;

	font-size: 12px;
	color: ${p => p.theme.ui.textMinorMuted};
`;

const Action = styled.div`
	display: flex;
	align-items: center;

	grid-column: 2;
	grid-row: 1 / 3;
`;

export default AlertItem;
