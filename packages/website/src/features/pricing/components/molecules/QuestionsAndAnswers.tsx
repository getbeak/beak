import React from 'react';
import { Link } from 'react-router-dom';
import { SmallContainer } from '@beak/website/components/atoms/Container';
import { BodyBold, BodyRegular, Title } from '@beak/website/components/atoms/Typography';
import styled from 'styled-components';

const QuestionsAndAnswers: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => (
	<Wrapper>
		<SmallContainer>
			<Title>{'Questions & answers'}</Title>
			<Table>
				<Card>
					<Question>{'Cross platform?'}</Question>
					<Answer>
						{'Your license will work on all platforms Beak supports; macOS, Windows, and Linux. If you '}
						{'switch platform, don\'t sweat it, you won\'t be signed out on the others.'}
					</Answer>
				</Card>
				<Card>
					<Question>{'Subscription'}</Question>
					<Answer>
						{'Beak is a subscription. You\'ll have access to Beak and all it\'s features for as long as '}
						{'your subscription is active. If you cancel, you\'ll continue to have access up until the '}
						{'end of your most recently paid cycle.'}
					</Answer>
				</Card>
				<Card>
					<Question>{'Refund policy'}</Question>
					<Answer>
						{'If you purchase Beak and decide within 7 days that you hate it, you can get a full refund '}
						{'no questions asked. Just reach out and we\'ll cancel your subscription and issue the refund '}
						{'right away.'}
					</Answer>
				</Card>
				<Card>
					<Question>{'Can\'t remember your email?'}</Question>
					<Answer>
						{'No sweat, contact Beak support on '}
						<a target={'_blank'} rel={'noopener noreferrer nofollow'} href={'https://twitter.com/beakapp'}>
							{'Twitter'}
						</a>
						{' or by '}
						<a href={'mailto:support@getbeak.app'}>{'Email'}</a>{' '}
						{'and we\'ll help you get back in.'}
					</Answer>
				</Card>
				<Card>
					<Question>{'Trial period'}</Question>
					<Answer>
						{'Beak comes with fully featured Trial mode. '}
						<Link to={'/#downloads'}>{'Download'}</Link>{' Beak to start your trial where you\'ll get '}
						{'access to all of Beak\'s features for 14 days!'}
					</Answer>
				</Card>
			</Table>
		</SmallContainer>
	</Wrapper>
);

export default QuestionsAndAnswers;

const Wrapper = styled.div`
	padding: 80px 0;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 50px 0;
	}
`;

const Table = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 20px;

	margin-top: 20px;
`;

const Card = styled.div`
	width: calc(50% - 10px);

	@media (max-width: 850px) {
		width: auto;
	}
`;

const Question = styled(BodyBold)`

`;
const Answer = styled(BodyRegular)`
	margin-top: 5px;
	font-size: 15px;
`;
