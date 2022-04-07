import { useContext, useEffect } from 'react';

import { SectionBodyContext, SectionBodyOptions } from '../context/section-body-context';

export default function useSectionBody(options: SectionBodyOptions) {
	const context = useContext(SectionBodyContext);

	useEffect(() => context?.(options), []);
}
