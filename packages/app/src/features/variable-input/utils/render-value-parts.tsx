import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { VariableGroups } from '@getbeak/types/variable-groups';
import * as uuid from 'uuid';

import { RealtimeValueManager } from '../../realtime-values';
import { ValueParts } from '../../realtime-values/values';
import { getVariableGroupItemName } from '../../realtime-values/values/variable-group-item';

export default function renderValueParts(parts: ValueParts, variableGroups: VariableGroups) {
	return renderToStaticMarkup(
		<React.Fragment>
			{parts.map((p, idx) => {
				if (typeof p === 'string')
					return <span key={p}>{p}</span>;

				if (typeof p !== 'object')
					return `[Unknown value part ${p}:(${typeof p})]`;

				const rtv = RealtimeValueManager.getRealtimeValue(p.type);
				const editable = 'editor' in rtv;
				const name = (() => {
					if (p.type === 'variable_group_item') {
						const payload = p.payload as { itemId: string };

						return getVariableGroupItemName(payload, variableGroups);
					}

					return rtv.name;
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
