import React from 'react';
import Container from '@beak/apps-web-marketing/components/atoms/Container';
import { faSuperpowers } from '@fortawesome/free-brands-svg-icons/faSuperpowers';
import { faFileCode } from '@fortawesome/free-regular-svg-icons/faFileCode';
import { faDiceD20 } from '@fortawesome/free-solid-svg-icons/faDiceD20';
import { faLanguage } from '@fortawesome/free-solid-svg-icons/faLanguage';
import { faPalette } from '@fortawesome/free-solid-svg-icons/faPalette';
import { faPeopleCarry } from '@fortawesome/free-solid-svg-icons/faPeopleCarry';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

import { Card, CardBody, CardGrid, CardIcons, CardTitle } from '../../../../components/atoms/Card';

const FeatureOverview: React.FC<React.PropsWithChildren<unknown>> = () => {
	const theme = useTheme();
	const hillVsSarah = Math.round(Math.random()) === 1 ? 'introduce' : 'bring home';

	return (
		<Container>
			<Wrapper>
				<FeatureTitle>{`The only API crafting tool you'd ${hillVsSarah} to your mother`}</FeatureTitle>

				<CardGrid>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faSuperpowers}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							{'Powerful feature set'}
						</CardTitle>
						<CardBody>
							{'From support for large API projects, realtime values, '}
							{'rich value editors, to baked in project encryption, for '}
							{'your most secretive of secrets 🤫.'}
						</CardBody>
					</Card>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faDiceD20}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							{'Realtime values'}
						</CardTitle>
						<CardBody>
							{'Realtime values are inline variables you can insert into '}
							{'any part of your request that are calculated in real time '}
							{'as you type, and as you send requests. '}
						</CardBody>
					</Card>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faPeopleCarry}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							<b>{'Un'}</b>
							{'-opinionated collaboration'}
						</CardTitle>
						<CardBody>
							{'Instead of trying to guess how your team works, Beak '}
							{'projects are simple folder and file structures, so you '}
							{'can fit it into your existing Git workflow however you '}
							{'want.'}
						</CardBody>
					</Card>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faPalette}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							{'Beautiful design language'}
						</CardTitle>
						<CardBody>
							{'Taking insporation from popular existing tools, Beak will '}
							{'feel powerful yet familiar, so you can spend less time '}
							{'learning, and more time hacking.'}
						</CardBody>
					</Card>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faFileCode}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							{'Comprehensive extensions API'}
						</CardTitle>
						<CardBody>
							{'Coming soon, is an expansive extensions API, allowing you '}
							{'to create custom extensions for realtime values, '}
							{'API workflows, and more. Make Beak your own.'}
						</CardBody>
					</Card>
					<Card>
						<CardIcons>
							<FontAwesomeIcon
								color={theme.ui.primaryFill}
								icon={faLanguage}
								size={'2x'}
							/>
						</CardIcons>
						<CardTitle>
							{'Fully cross platform'}
						</CardTitle>
						<CardBody>
							{'Wether you\'re on macOS, or Windows. Beak will '}
							{'look, work, and most importantly, feel the same.'}
						</CardBody>
					</Card>
				</CardGrid>
			</Wrapper>
		</Container>
	);
};

const Wrapper = styled.section`
	padding: 25px 0;
`;

const FeatureTitle = styled.h3`
	margin: 30px 0;
	margin-bottom: 55px;
	text-align: center;
	font-size: 30px;
	font-weight: 100;
`;

export default FeatureOverview;
