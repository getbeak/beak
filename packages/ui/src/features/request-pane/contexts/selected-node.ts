import type { ValidRequestNode } from '@getbeak/types/nodes';
import React from 'react';

// @ts-expect-error
const SelectedNodeContext = React.createContext<ValidRequestNode>(null);

export default SelectedNodeContext;
