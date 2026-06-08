import type { AssetRef } from '@getbeak/extension-sdk';

import { ValueSections } from './values';

export type VariableSets = Record<string, VariableSet>;

export interface VariableSet {
	sets: Record<string, string>;
	items: Record<string, string>;
	values: Record<string, VariableSetValue>;
}

/**
 * The bound value for one (set × item) pair. Either text-typed
 * `ValueSections` (the legacy shape, which is also a bare array so old
 * files round-trip) or a content-addressed asset reference for binary
 * environment values — cert/key pairs, image fixtures, anything not
 * naturally expressible as a string.
 *
 * Legacy on-disk values that are bare `ValueSections` arrays count as
 * text; the renderer normalises on read.
 */
export type VariableSetValue =
	| ValueSections
	| { kind: 'text'; value: ValueSections }
	| {
			kind: 'asset';
			ref: AssetRef;
			filename?: string;
	  };
