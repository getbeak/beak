import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router';

export default function useBeakProjectUrl() {
	const { projectId } = useParams();
	const { search } = useLocation();

	return useMemo(() => {
		const parsed = new URLSearchParams(search);
		const requestId = parsed.get('requestId');

		const final = new URLSearchParams();

		final.set('projectId', projectId ?? '');
		final.set('requestId', requestId ?? '');

		return `beak-app://launch/project?${final.toString()}`;
	}, [search]);
}
