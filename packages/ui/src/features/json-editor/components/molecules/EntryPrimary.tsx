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
 * Mirrors the BasicTableEditor's required dot — pink bullet next to the
 * key cell when the schema declared this entry required. Tooltip is the
 * shared `tt-schema-row-description` anchor.
 */
const RequiredDot: React.FC<{ description?: string }> = ({ description }) => (
	<Box
		flexShrink={0}
		w='5px'
		h='5px'
		ml='1.5'
		borderRadius='full'
		bg='accent.pink'
		data-tooltip-id='tt-schema-row-description'
		data-tooltip-content={description ?? 'Required by schema'}
	/>
);

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
	if (description && !editorContext.schemaMode) {
		tooltipAttrs['data-tooltip-id'] = 'tt-schema-row-description';
		tooltipAttrs['data-tooltip-content'] = description;
	}

	return (
		<BodyInputWrapper {...tooltipAttrs}>
			<DebouncedInput
				type='text'
				value={detectName(depth, value)}
				onChange={name => dispatch(editorContext.nameChange({ id: value.id, requestId, name }))}
			/>
			{value.required === true && !editorContext.schemaMode && <RequiredDot description={description} />}
		</BodyInputWrapper>
	);
};

export default EntryPrimary;
