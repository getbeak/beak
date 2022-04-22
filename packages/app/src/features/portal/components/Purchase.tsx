import React, { useEffect, useState } from 'react';
import Button from '@beak/app/components/atoms/Button';
import { ipcExplorerService, ipcPreferencesService } from '@beak/app/lib/ipc';
import { faTags } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

interface PurchaseProps {
	onChangeToTrial: () => void;
}

const Purchase: React.FunctionComponent<React.PropsWithChildren<PurchaseProps>> = ({ onChangeToTrial }) => {
	const [buyUrl, setBuyUrl] = useState('https://buy.stripe.com/eVa8xY80KedAdWw7ss');
	const [, setPricingUrl] = useState('https://getbeak.app/pricing');

	useEffect(() => {
		getPurchaseInformation().then(({ buyUrl, pricingUrl }) => {
			setBuyUrl(buyUrl);
			setPricingUrl(pricingUrl);
		});
	}, []);

	return (
		<Wrapper>
			<Logo>
				<FontAwesomeIcon icon={faTags} />
			</Logo>
			<Title>{'New to Beak?'}</Title>
			<SubTitle>
				{'For just $25 a year, get access to Beak\'s full set of powerful features.'}
			</SubTitle>
			<SubTitle>
				{'No hidden fees, no pricing tiers.'}
			</SubTitle>

			<ActionContainer>
				{/* <Button onClick={() => ipcExplorerService.launchUrl(pricingUrl)}>{'View pricing page'}</Button> */}
				<Button
					color={'primary'}
					onClick={() => ipcExplorerService.launchUrl(buyUrl)}
				>
					{'Buy'}
				</Button>
				<Button onClick={() => onChangeToTrial()}>{'Start trial'}</Button>
			</ActionContainer>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	width: 100%;
`;

const Logo = styled.div`
	width: 70px; height: 70px;
	text-align: center;
	margin: 0 auto;
	margin-bottom: 5px;

	> svg {
		width: 65px !important;
		height: 65px;
	}
`;

const Title = styled.div`
	text-align: center;
	font-size: 24px;
	font-weight: 500;
	margin-bottom: 10px;
`;

const SubTitle = styled.p`
	text-align: center;
	font-size: 14px;
`;

const ActionContainer = styled.div`
	margin: 10px auto;
	height: 150px;
	max-width: 250px;
	-webkit-app-region: no-drag;

	> ${Button} {
		margin-top: 5px;
		width: 100%;
	}
`;

async function getPurchaseInformation() {
	const environment = await ipcPreferencesService.getEnvironment();

	if (environment === 'prod') {
		return {
			buyUrl: 'https://buy.stripe.com/eVa8xY80KedAdWw7ss',
			pricingUrl: 'https://getbeak.app/pricing',
		};
	}

	return {
		buyUrl: 'https://buy.stripe.com/test_14k6p84Zp2V56d27st',
		pricingUrl: 'https://nonprod-getbeak.app/pricing',
	};
}

export default Purchase;
