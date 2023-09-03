import React from 'react';
import type { ValidRequestNode } from '@getbeak/types/nodes';

// @ts-expect-error
const SelectedNodeContext = React.createContext<ValidRequestNode>(null);

export default SelectedNodeContext;
