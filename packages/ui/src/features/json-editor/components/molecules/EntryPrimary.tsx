import { entryMap, valueParts } from '@beak/state';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { Box } from '@chakra-ui/react';
import type { Entries } from '@getbeak/types/body-editor-json';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyInputWrapper, BodyNameOverrideWrapper } from '../atoms/Cells';
import { detectName } from './JsonEntry';

/**
 * Subtle "*" indicator that flags a row as required by the schema. Borrows
 * the form-field convention from the rest of the world: a small asterisk
 * after the field name says "this matters", without painting half the row.
 * Indigo by default (schema-authoring palette); shifts to alert-red when
 * the row also has no value so a single look tells the user *which*
 * required row still needs filling in. Tooltip carries the description.
 */
const RequiredBadge: React.FC<{ description?: string; missing?: boolean }> = ({ description, missing }) => {
	const tone = missing ? 'alert' : 'indigo';
	const tooltip = missing
		? `Required — value can't be empty${description ? `. ${description}` : ''}`
		: (description ?? 'Required by schema');
	return (
		<Box
			as='span'
			flexShrink={0}
			ml='1'
			color={`accent.${tone}`}
			fontSize='13px'
			fontWeight='600'
			lineHeight='1'
			cursor='help'
			data-tooltip-id='tt-schema-row-description'
			data-tooltip-content={tooltip}
		>
			{'∗'}
		</Box>
	);
};

interface EntryPrimaryProps {
	depth: number;
	requestId: string;
	value: Entries;
	nameOverride?: string;
}

/**
 * Renders the contents of the row's primary (key) cell. Three cases:
 *
 *  - `depth === 0` — the JSON body root, which has no key in the spec.
 *    We show a faded "Body" label so the user isn't confused by an
 *    empty / `<Root>` input. No edit affordance.
 *  - `nameOverride` is set — array indices and other read-only labels
 *    that the row needs to display.
 *  - otherwise — a debounced text input that writes through the editor
 *    context's `nameChange` action.
 */
const EntryPrimary: React.FC<EntryPrimaryProps> = ({ depth, requestId, value, nameOverride }) => {
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;

	if (depth === 0) {
		return (
			<BodyNameOverrideWrapper fontStyle='italic' color='fg.subtle'>
				{'Body'}
			</BodyNameOverrideWrapper>
		);
	}

	if (nameOverride !== void 0) {
		return <BodyNameOverrideWrapper>{nameOverride}</BodyNameOverrideWrapper>;
	}

	const description = value.description;
	const tooltipAttrs: Record<string, string> = {};
	// In `valuesOnly` mode the description gets its own Info icon (see below)
	// so we don't double up the tooltip on the input wrapper.
	if (description && !editorContext.schemaMode && !editorContext.valuesOnly) {
		tooltipAttrs['data-tooltip-id'] = 'tt-schema-row-description';
		tooltipAttrs['data-tooltip-content'] = description;
	}

	const name = detectName(depth, value);
	// Mirror EntryRow's missingRequired check so the badge can shift to its
	// "needs a value" tone — same predicate keeps the two indicators in
	// lockstep without threading a prop through every entry kind.
	const missingRequired =
		value.required === true && !editorContext.schemaMode && value.enabled !== false && isEntryValueEmpty(value);

	return (
		<BodyInputWrapper {...tooltipAttrs}>
			{editorContext.valuesOnly ? (
				<Box
					flex='1'
					display='inline-flex'
					alignItems='center'
					h='26px'
					px='8px'
					fontSize='12px'
					lineHeight='26px'
					color='fg.default'
					whiteSpace='nowrap'
					overflow='hidden'
					textOverflow='ellipsis'
				>
					{name || (
						<Box as='span' color='fg.subtle'>
							{'(unnamed)'}
						</Box>
					)}
				</Box>
			) : (
				<DebouncedInput
					type='text'
					value={name}
					placeholder='Field name'
					onChange={n => dispatch(editorContext.nameChange({ id: value.id, requestId, name: n }))}
				/>
			)}
			{value.required === true && !editorContext.schemaMode && (
				<RequiredBadge description={description} missing={missingRequired} />
			)}
		</BodyInputWrapper>
	);
};

function isEntryValueEmpty(entry: Entries): boolean {
	return entryMap.isEntryValueEmpty(entry, valueParts.isEmpty);
}

export default EntryPrimary;
