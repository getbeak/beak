import CtaButton from '@beak/website/components/atoms/Buttons';
import { BodyBold } from '@beak/website/components/atoms/Typography';
import { faFeather } from '@fortawesome/free-solid-svg-icons/faFeather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

const PricingCard: React.FunctionComponent = () => (
	<Card>
		<CardHeader>
			{'Everything'}
		</CardHeader>
		<CardPricing>
			<Price>
				<sup>{'$'}</sup>{'25'}
			</Price>
			<PriceTerms>{'per year'}</PriceTerms>
		</CardPricing>
		<CardBody>
			<BodyBold>
				{'Leave no stone unturned. This tier comes with it all, no foot-stool required.'}
			</BodyBold>
			<PointList>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{'Requests'}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{'Responses'}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{'Realtime values'}
				</li>
				<li>
					<FontAwesomeIcon icon={faFeather} listItem />
					{'Literally everything'}
				</li>
			</PointList>
		</CardBody>
		<CardFooter>
			<CtaButton target={'_blank'} href={'https://buy.stripe.com/test_14k6p83Vl0MX7h6bII'}>
				{'Buy now'}
			</CtaButton>
		</CardFooter>
	</Card>
);

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
		}
	}
`;
