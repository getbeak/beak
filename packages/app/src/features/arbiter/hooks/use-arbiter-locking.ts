import { useAppSelector } from '@beak/app/store/redux';
import { differenceInDays } from 'date-fns';

export default function useArbiterLocking() {
	const arbiter = useAppSelector(s => s.global.arbiter.status);
	const now = new Date();
	const lastSuccessfulCheck = new Date(arbiter.lastSuccessfulCheck);
	const sinceLastCheck = differenceInDays(now, lastSuccessfulCheck);
	// const showWarning = sinceLastCheck > 1;
	const showWarning = false;

	const friendlyLockNotice = (() => {
		const daysUntilLock = 5 - sinceLastCheck;

		switch (true) {
			case daysUntilLock > 2:
				return `in ${daysUntilLock} days`;

			case daysUntilLock === 1:
				return 'tomorrow';

			default:
			case daysUntilLock <= 0:
				return 'today';
		}
	})();

	return {
		lastSuccessfulCheck,
		sinceLastCheck,
		showWarning,
		friendlyLockNotice,
	};
}
