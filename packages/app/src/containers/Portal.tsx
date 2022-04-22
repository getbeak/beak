import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { toVibrancyAlpha } from '../design-system/utils';
import CreateTrial from '../features/portal/components/CreateTrial';
import Purchase from '../features/portal/components/Purchase';
import SignIn from '../features/portal/components/SignIn';

type Variant = 'default' | 'trial_creation';

const Portal: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
	const [variant, setVariant] = useState<Variant>('default');

	return (
		<Wrapper>
			<Accent $variant={variant} />
			<Container $variant={variant}>
				{variant === 'default' && (
					<React.Fragment>
						<SignIn />
						<Purchase onChangeToTrial={() => setVariant('trial_creation')} />
					</React.Fragment>
				)}
				{variant === 'trial_creation' && (
					<CreateTrial onChangeToDefault={() => setVariant('default')} />
				)}
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
	height: 100vh; width: 100vw;
	-webkit-app-region: drag;
`;

const Accent = styled.div<{ $variant: Variant }>`
	position: absolute;
	top: 0; bottom: 0; left: 375px;

	width: 1100px; height: 2800px;
	background: ${p => toVibrancyAlpha(p.theme.ui.primaryFill, 0.70)};

	transition: transform 0.2s ease;

	transform: rotate(20deg) translateX(-350px);
	transform-origin: center;

	${p => p.$variant === 'trial_creation' && css`
		transform: rotate(20deg) translateX(-800px);
	`}
`;

const Container = styled.div<{ $variant: Variant }>`
	position: absolute;
	display: grid;
	grid-template-columns: ${p => p.$variant === 'trial_creation' ? '1fr' : 'repeat(2, .5fr)'};
	grid-template-rows: 1fr;
	gap: 50px;
	width: calc(100% - 100px); height: calc(100% - 100px);
	margin: 50px;
`;

export default Portal;
