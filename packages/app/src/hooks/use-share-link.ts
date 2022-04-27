import { useAppSelector } from '../store/redux';

export default function useShareLink(requestId: string) {
	const id = useAppSelector(s => s.global.project.id);

	const search = new URLSearchParams({ requestId });
	const url = `https://share.getbeak.app/projects/${encodeURIComponent(id!)}?${search.toString()}`;

	return url;
}
