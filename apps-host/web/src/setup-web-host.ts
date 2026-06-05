import { Buffer } from 'buffer';
import { setLocalAgentCapability } from '@beak/ui/services/agent';

import getRuntime from './host';

// Polyfill Node-style `Buffer` for libraries that don't ship browser builds
// (isomorphic-git in particular reaches for it during commit / index ops).
// Must run before any IPC service that may invoke project.create.
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

window.embeddedIndicator = false;

// Publish the host's localAgent capability to the renderer so the agent
// UI surfaces can gate on it without an import cycle. Set here (before
// `index.tsx` loads `@beak/ui`) so the first render of any agent
// component already sees the right value.
setLocalAgentCapability(getRuntime().capabilities.localAgent);

import './ipc/app-service';
import './ipc/beak-hub-service';
