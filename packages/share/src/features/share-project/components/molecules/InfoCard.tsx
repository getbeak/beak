import React, { useEffect } from 'react';
import CtaButton from '@beak/share/components/atoms/Buttons';
import { SubTitle, Title } from '@beak/share/components/atoms/Typography';
import useBeakProjectUrl from '@beak/share/hooks/use-beak-project-url';
import styled from 'styled-components';

const InfoCard: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
	const beakUrl = useBeakProjectUrl();

	useEffect(() => {
		window.location.href = beakUrl;
	}, [beakUrl]);

	return (
		<Card>
			<Brand />
			<Ugh>
				<Title>{'Someone has shared a Beak with you'}</Title>
				<SubTitle>
					{'Someone has shared a beak project with you, if Beak doesn\'t launch automatically, you can '}
					{'tap the button below.'}
				</SubTitle>

				<Spacer />

				<CtaButton $style={'primary'} onClick={() => {
					window.location.href = beakUrl;
				}}>
					{'Launch Beak'}
				</CtaButton>
			</Ugh>
		</Card>
	);
};

const Card = styled.div`
	display: grid;
	gap: 20px;
	grid-template-columns: 150px 1fr;
	border-radius: 10px;
	background: ${p => p.theme.ui.surface};
	padding: 25px;
`;

const Brand = styled.div`
	background-image: url('/assets/logo-tile.png');
	background-position: center;
	background-repeat: no-repeat;
	background-size: 100px;
	height: 100px;
`;

const Ugh = styled.div`
	
`;

const Spacer = styled.div`
	margin-top: 20px;
`;

export default InfoCard;
