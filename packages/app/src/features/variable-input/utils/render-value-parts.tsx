import { ValueParts, VariableGroups } from '@beak/common/types/beak-project';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as uuid from 'uuid';

import { getRealtimeValue } from '../../realtime-values';
import { getVariableGroupItemName } from '../../realtime-values/values/variable-group-item';

export default function renderValueParts(parts: ValueParts, variableGroups: VariableGroups) {
	return renderToStaticMarkup(
		<React.Fragment>
			{parts.map((p, idx) => {
				if (typeof p === 'string')
					return <span key={p}>{p}</span>;

				if (typeof p !== 'object')
					return `[Unknown value part ${p}:(${typeof p})]`;

				const impl = getRealtimeValue(p.type);

				if (!impl) {
					console.error(`Unknown RTV ${p} ${typeof p} ${p.type}`);

					return null;
				}

				const editable = Boolean(impl.editor);
				const name = (() => {
					if (p.type === 'variable_group_item')
						return getVariableGroupItemName(p.payload, variableGroups);

					return impl.name;
				})();

				return (
					<div
						className={'bvs-blob'}
						contentEditable={false}
						data-index={idx}
						data-editable={editable}
						data-type={p.type}
						data-payload={p.payload ? JSON.stringify(p.payload) : void 0}
						key={uuid.v4()}
					>
						{name}
					</div>
				);
			})}
		</React.Fragment>,
	);
}
