import { Box } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { ipcExplorerService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import { Tags } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

interface PurchaseProps {
	onChangeToTrial: () => void;
}

const Purchase: React.FC<PurchaseProps> = ({ onChangeToTrial }) => {
	const [buyUrl, setBuyUrl] = useState('https://buy.stripe.com/eVa8xY80KedAdWw7ss');
	const [, setPricingUrl] = useState('https://getbeak.app/pricing');

	useEffect(() => {
		getPurchaseInformation().then(({ buyUrl, pricingUrl }) => {
			setBuyUrl(buyUrl);
			setPricingUrl(pricingUrl);
		});
	}, []);

	return (
		<Box w='100%'>
			<Box
				w='70px'
				h='70px'
				textAlign='center'
				mx='auto'
				mb='1.5'
				css={{ '> svg': { width: '65px !important', height: '65px' } }}
			>
				<Tags />
			</Box>
			<Box textAlign='center' fontSize='2xl' fontWeight='medium' mb='2.5'>
				{'New to Beak?'}
			</Box>
			<Box as='p' textAlign='center' fontSize='lg'>
				{"For just $25 a year, get access to Beak's full set of powerful features."}
			</Box>
			<Box as='p' textAlign='center' fontSize='lg'>
				{'No hidden fees, no pricing tiers.'}
			</Box>

			<Box
				mx='auto'
				my='2.5'
				h='150px'
				maxW='250px'
				style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
				css={{ '> button': { marginTop: '5px', width: '100%' } }}
			>
				<Button color='primary' onClick={() => ipcExplorerService.launchUrl(buyUrl)}>
					{'Buy'}
				</Button>
				<Button onClick={() => onChangeToTrial()}>{'Start trial'}</Button>
			</Box>
		</Box>
	);
};

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
