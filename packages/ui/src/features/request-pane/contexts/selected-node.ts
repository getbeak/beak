import type { ValidRequestNode } from '@getbeak/types/nodes';
import React from 'react';

const SelectedNodeContext = React.createContext<ValidRequestNode | null>(null);

export default SelectedNodeContext;
