/*
	Defines the Beak extension runtime that the extension is run within
*/

import { Context } from '@getbeak/types/values';

declare const beakApi: Beak;

type Level = 'info' | 'warn' | 'error';

interface Beak {
	parseValueParts: (ctx: Context, parts: unknown[], recursiveSet: Set<string>) => Promise<string>;

	log: (level: Level, message: string) => void;
}
