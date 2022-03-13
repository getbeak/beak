import { differenceInDays } from 'date-fns';
import React from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
	0% {
		background-color: #f9ba40;
	}
	50% {
		background-color: #e09e3a;
	}
	100 {
		background-color: #f9ba40;
	}
`;

const Arbiter: React.FunctionComponent = ({ children }) => {
	const arbiter = useSelector(s => s.global.arbiter.status);
	const now = new Date();
	const lastSuccessfulCheck = new Date(arbiter.lastSuccessfulCheck);
	const sinceLastCheck = differenceInDays(now, lastSuccessfulCheck);
	const showWarning = sinceLastCheck > 1;

	function renderFriendlyLockNotice() {
		const daysUntilLock = 5 - sinceLastCheck;

		switch (true) {
			case daysUntilLock > 2:
				return `${daysUntilLock} days`;

			case daysUntilLock === 1:
				return 'tomorrow';

			default:
			case daysUntilLock <= 0:
				return 'today';
		}
	}

	return (
		<React.Fragment>
			{arbiter.status && children}
			{showWarning && (
				<WarningBanner>
					{`Unable to check license. Beak will lock in ${renderFriendlyLockNotice()}`}
				</WarningBanner>
			)}
		</React.Fragment>
	);
};

const WarningBanner = styled.div`
	position: absolute;
	bottom: 0; left: 0; right: 0;
	background: #f9ba40;
	padding: 8px 8px;
	font-size: 14px;

	z-index: 101;

	animation: ${pulse} 5s infinite;
`;

export default Arbiter;
