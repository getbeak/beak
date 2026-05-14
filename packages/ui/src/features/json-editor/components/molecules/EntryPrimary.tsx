import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { Entries } from '@getbeak/types/body-editor-json';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyInputWrapper, BodyNameOverrideWrapper } from '../atoms/Cells';
import { detectName } from './JsonEntry';

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

	return (
		<BodyInputWrapper>
			<DebouncedInput
				type='text'
				value={detectName(depth, value)}
				onChange={name => dispatch(editorContext.nameChange({ id: value.id, requestId, name }))}
			/>
		</BodyInputWrapper>
	);
};

export default EntryPrimary;
