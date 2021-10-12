import Button from '@beak/app/components/atoms/Button';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import React from 'react';
import styled from 'styled-components';

export interface SubscriptionInformationProps {
	subscription: GetSubscriptionStatusResponse;
}

const SubscriptionInformation: React.FunctionComponent<SubscriptionInformationProps> = ({ subscription }) => (
	<React.Fragment>
		<Container>
			<LogoSection>
				<LogoOuter />
			</LogoSection>
			<AboutSection>
				<Title>{'Beak subscription'}</Title>
				<SubTitle>{'Your current Beak subscription'}</SubTitle>

				{subscription.billingPortalUrl && (
					<Button onClick={() => ipcExplorerService.launchUrl(subscription.billingPortalUrl!)}>
						{'Visit billing portal'}
					</Button>
				)}
			</AboutSection>
			<PricingSection>
				<PricingPrice>{'$25.00'}</PricingPrice>
				<PricingTime>{' / month'}</PricingTime>
			</PricingSection>
		</Container>

		{/* <textarea>{subscription.billingPortalUrl}</textarea> */}
	</React.Fragment>
);

const Container = styled.div`
	display: grid;
	grid-template-rows: 1fr;
	grid-template-columns: 0.15fr 0.5fr 0.4fr;

	border-radius: 10px;
	padding: 20px;
	background: ${p => p.theme.ui.secondarySurface};
`;

const LogoSection = styled.div`
	grid-column: 1;
`;

const LogoOuter = styled.div`
	border-radius: 100%;
	width: 60px; height: 60px;
	background: ${p => p.theme.ui.secondaryBackground};
	background-image: url('./images/logo.svg');
	background-repeat: no-repeat;
	background-position: center;
	background-size: 35px;
`;

const AboutSection = styled.div`
	grid-column: 2;
`;

const Title = styled.div`
	font-size: 20px;
	font-weight: 500;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const SubTitle = styled.div`
	font-size: 14px;
	margin-top: 5px;
	margin-bottom: 20px;
	color: ${p => p.theme.ui.textMinor};
`;

const PricingSection = styled.div`
	grid-column: 3;

	text-align: right;
`;

const PricingPrice = styled.span`
	font-weight: 600;
	font-size: 18px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const PricingTime = styled.span`
	color: ${p => p.theme.ui.textMinor};
	font-size: 13px;
`;

export default SubscriptionInformation;
