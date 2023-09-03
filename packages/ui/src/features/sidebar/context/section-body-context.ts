import { createContext } from 'react';

export interface SectionBodyOptions {
	minHeight?: string | undefined;
	maxHeight?: string | undefined;
	flexGrow?: number | undefined;
	flexShrink?: number | undefined;
}

type Context = (options: SectionBodyOptions) => void;

export const SectionBodyContext = createContext<Context | null>(null);
