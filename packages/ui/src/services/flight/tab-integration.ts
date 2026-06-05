import { nextFlightHistory, previousFlightHistory, selectActiveFlight } from '@beak/state/flight';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/redux';

export function useSelectedTabId(): string | undefined {
	return useAppSelector(s => s.features.tabs.selectedTab);
}

export function useSelectedTabFlightRequirements() {
	const selectedTabId = useSelectedTabId();
	const history = useAppSelector(s => (selectedTabId ? s.global.flight.flightHistories[selectedTabId] : undefined));

	if (!selectedTabId || !history) return null;

	const keys = Object.keys(history.history);
	const selectedIndex = history.selected ? keys.indexOf(history.selected) : -1;

	return {
		canGoBack: selectedIndex > 0,
		canGoForward: selectedIndex >= 0 && selectedIndex < keys.length - 1,
		totalFlights: keys.length,
		currentIndex: selectedIndex,
		selectedFlightId: history.selected,
	};
}

export function useNavigateFlightHistoryForSelectedTab() {
	const dispatch = useAppDispatch();
	const selectedTabId = useSelectedTabId();

	const goToNext = useCallback(() => {
		if (selectedTabId) dispatch(nextFlightHistory({ requestId: selectedTabId }));
	}, [dispatch, selectedTabId]);

	const goToPrevious = useCallback(() => {
		if (selectedTabId) dispatch(previousFlightHistory({ requestId: selectedTabId }));
	}, [dispatch, selectedTabId]);

	return { goToNext, goToPrevious };
}

export function useSelectedTabFlightStatus():
	| { status: 'pending' }
	| { status: 'active'; flightId: string }
	| { status: 'failed'; error: Error }
	| { status: 'complete'; httpStatus: number; flightId: string } {
	const selectedTabId = useSelectedTabId();
	const activeFlight = useAppSelector(s => (selectedTabId ? selectActiveFlight(selectedTabId)(s) : null));
	const flightState = useAppSelector(s => (selectedTabId ? s.global.flight.flightStates[selectedTabId] : undefined));

	if (!selectedTabId) return { status: 'pending' };
	if (activeFlight) return { status: 'active', flightId: activeFlight.flightId };
	if (flightState?.status === 'failed') return { status: 'failed', error: flightState.error };
	if (flightState?.status === 'completed') {
		return {
			status: 'complete',
			flightId: flightState.result.flightId,
			httpStatus: flightState.result.response?.status ?? 0,
		};
	}
	return { status: 'pending' };
}
