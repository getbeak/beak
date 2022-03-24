import React from 'react';
import CtaButton from '@beak/website/components/atoms/Buttons';
import { BodyBold } from '@beak/website/components/atoms/Typography';
import { faFeather } from '@fortawesome/free-solid-svg-icons/faFeather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

type Version = 'primary' | 'secondary' | 'tertiary';

interface VersionInformation {
	title: string;
	body: string;
	items: [string, string, string, string];
}

const versions: Record<Version, VersionInformation> = {
	primary: {
		title: 'Everything',
		body: 'Leave no stone unturned. This tier comes with it all, no foot-stool required',
		items: [
			'Requests',
			'Responses',
			'Realtime values',
			'Literally everything',
		],
	},
	secondary: {
		title: 'All of it',
		body: 'Leave no stone unturned. This tier comes with it all, no foot-stool required',
		items: [
			'Requests',
			'Responses',
			'Realtime values',
			'Literally everything',
		],
	},
	tertiary: {
		title: 'Also everything',
		body: 'Leave no stone unturned. This tier comes with it all, no foot-stool required',
		items: [
			'Requests',
			'Responses',
			'Realtime values',
			'Literally everything',
		],
	},
};

interface PricingCardProps {
	version: Version;
}

const PricingCard: React.FunctionComponent<PricingCardProps> = ({ version }) => (
	<Card>
		<CardHeader>
			{versions[version].title}
		</CardHeader>
		<CardPricing>
			<Price>
				<sup>{'$'}</sup>{'25'}
			</Price>
			<PriceTerms>{'per year'}</PriceTerms>
		</CardPricing>
		<CardBody>
			<BodyBold>
				{versions[version].body}
			</BodyBold>
			<PointList>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{versions[version].items[0]}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{versions[version].items[1]}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{versions[version].items[2]}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{versions[version].items[3]}
				</li>
			</PointList>
		</CardBody>
		<CardFooter>
			<CtaButton
				$style={version === 'primary' ? 'primary' : 'tertiary'}
				target={'_blank'}
				href={getPurchaseLink()}
			>
				{'Buy now'}
			</CtaButton>
		</CardFooter>
	</Card>
);

function getPurchaseLink() {
	if (window.location.host === 'getbeak.app')
		return 'https://buy.stripe.com/eVa8xY80KedAdWw7ss';

	return 'https://buy.stripe.com/test_14k6p84Zp2V56d27st';
}

export default PricingCard;

const Card = styled.div`
	position: relative;
	margin: 0 auto;
	background: ${p => p.theme.ui.secondarySurface};
`;

const CardHeader = styled.div`
	background: ${p => p.theme.ui.primaryFill};
	padding: 20px 10px;

	text-align: center;
	font-size: 30px;
	font-weight: 700;
`;
const CardBody = styled.div`
	padding: 25px;
	font-size: 14px;
`;
const CardFooter = styled.div`
	padding: 35px 25px;
	text-align: center;
	background: ${p => p.theme.ui.surfaceFill};
`;

const CardPricing = styled(CardBody)`
	border-bottom: 1px solid ${p => p.theme.ui.surface};
	text-align: center;
`;
const Price = styled.div`
	font-size: 50px;
	font-weight: 700;

	> sup {
		font-size: 25px;
		font-weight: normal;
	}
`;
const PriceTerms = styled.div`
	color: ${p => p.theme.ui.textMinor};
`;

const PointList = styled.ul`
	position: relative;
	list-style-type: none;
	margin-left: 25px;
	padding-left: 0;

	> li {
		padding: 3px 0;

		> svg {
			margin-top: 3px;
			top: auto !important;
		}
	}
`;
